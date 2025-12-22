// preload.js - Secure bridge between main and renderer processes
// Exposes specific IPC methods to renderer via contextBridge.
// Renderer cannot access Node.js or Electron APIs directly.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // File/directory selection - returns path string or null
  selectMp4: () => ipcRenderer.invoke('select-mp4'),
  selectVtt: () => ipcRenderer.invoke('select-vtt'),
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),

  // Run encoding - returns { success, outputPath } or { success, error }
  encode: (mp4Path, vttPath, outputDir) =>
    ipcRenderer.invoke('encode', mp4Path, vttPath, outputDir),

  // Subscribe to ffmpeg stderr stream
  onFfmpegOutput: (callback) => {
    ipcRenderer.on('ffmpeg-output', (event, data) => callback(data));
  }
});
