// main.js - Electron main process
// Handles window creation, file dialogs, and ffmpeg process spawning.
// All Node.js / system access happens here; renderer communicates via IPC.

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;

// Find ffmpeg binary - packaged apps don't inherit shell PATH
function findFfmpeg() {
  const candidates = [
    '/opt/homebrew/bin/ffmpeg',      // Apple Silicon Homebrew
    '/usr/local/bin/ffmpeg',         // Intel Homebrew
    '/usr/bin/ffmpeg',               // System install
    'ffmpeg'                         // Fallback to PATH (works in dev)
  ];
  for (const p of candidates) {
    if (p === 'ffmpeg' || fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}
let ffmpegProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      // Security: renderer cannot access Node.js directly
      contextIsolation: true,
      nodeIntegration: false,
      // Preload script bridges main <-> renderer securely
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Kill any running ffmpeg process on quit
  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGTERM');
  }
  app.quit();
});

// IPC handler: open file dialog for MP4
ipcMain.handle('select-mp4', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

// IPC handler: open file dialog for VTT
ipcMain.handle('select-vtt', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'VTT Subtitles', extensions: ['vtt'] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

// IPC handler: open directory dialog for output
ipcMain.handle('select-output-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

// Escape path for ffmpeg filter syntax (subtitles filter)
// Special chars in filter options: \ : ' [ ] must be escaped
function escapeFilterPath(p) {
  return p
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

// IPC handler: run ffmpeg encoding
// Spawns ffmpeg as child process, streams stderr to renderer via IPC events.
ipcMain.handle('encode', async (event, mp4Path, vttPath, outputDir) => {
  return new Promise((resolve) => {
    // Locate ffmpeg binary
    const ffmpegPath = findFfmpeg();
    if (!ffmpegPath) {
      resolve({ success: false, error: 'ffmpeg not found. Install via: brew install ffmpeg' });
      return;
    }

    // Build output filename from input MP4 name
    const inputBasename = path.basename(mp4Path, path.extname(mp4Path));
    const outputPath = path.join(outputDir, `${inputBasename}_hls_safe.mp4`);

    // Build ffmpeg args - conditionally include subtitles filter if VTT provided
    const args = [
      '-y',
      '-i', mp4Path
    ];

    // Add subtitles filter only if VTT path is provided
    if (vttPath) {
      const escapedVttPath = escapeFilterPath(vttPath);
      args.push('-vf', `subtitles=${escapedVttPath}`);
    }

    // HLS-safe encoding settings
    args.push(
      '-map', '0:v:0',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-profile:v', 'main',
      '-level', '4.0',
      '-pix_fmt', 'yuv420p',
      '-fps_mode', 'cfr',
      '-r', '24',
      '-g', '96',
      '-keyint_min', '96',
      '-sc_threshold', '0',
      '-x264-params', 'open-gop=0:repeat-headers=1',
      '-c:a', 'aac',
      '-ar', '48000',
      '-ac', '2',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath
    );

    // Spawn ffmpeg - uses system-installed ffmpeg
    ffmpegProcess = spawn(ffmpegPath, args);

    // Stream stderr to renderer (ffmpeg outputs progress to stderr)
    ffmpegProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('ffmpeg-output', data.toString());
    });

    // Handle process completion
    ffmpegProcess.on('close', (code) => {
      ffmpegProcess = null;
      if (code === 0) {
        resolve({ success: true, outputPath });
      } else {
        resolve({ success: false, error: `ffmpeg exited with code ${code}` });
      }
    });

    // Handle spawn errors (e.g., ffmpeg not found)
    ffmpegProcess.on('error', (err) => {
      ffmpegProcess = null;
      resolve({ success: false, error: err.message });
    });
  });
});
