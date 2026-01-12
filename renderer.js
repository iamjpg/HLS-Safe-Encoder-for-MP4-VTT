// renderer.js - Renderer process logic
// Handles UI interactions, calls main process via window.api (exposed by preload).
// No direct access to Node.js or Electron APIs.

let mp4Path = null;
let vttPath = null;
let outputDir = null;

const mp4PathEl = document.getElementById('mp4Path');
const vttPathEl = document.getElementById('vttPath');
const outputDirPathEl = document.getElementById('outputDirPath');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');
const encodeBtn = document.getElementById('encode');

// Enable encode button when MP4 and output directory are selected (VTT is optional)
function updateEncodeButton() {
  encodeBtn.disabled = !(mp4Path && outputDir);
}

// Clear file/directory selection handlers
document.getElementById('clearMp4').addEventListener('click', () => {
  mp4Path = null;
  mp4PathEl.textContent = 'No file selected';
  mp4PathEl.classList.remove('has-file');
  updateEncodeButton();
});

document.getElementById('clearVtt').addEventListener('click', () => {
  vttPath = null;
  vttPathEl.textContent = 'No file selected';
  vttPathEl.classList.remove('has-file');
  updateEncodeButton();
});

document.getElementById('clearOutputDir').addEventListener('click', () => {
  outputDir = null;
  outputDirPathEl.textContent = 'No directory selected';
  outputDirPathEl.classList.remove('has-file');
  updateEncodeButton();
});

// File selection handlers - call main process via IPC
document.getElementById('selectMp4').addEventListener('click', async () => {
  const path = await window.api.selectMp4();
  if (path) {
    mp4Path = path;
    mp4PathEl.textContent = path;
    mp4PathEl.classList.add('has-file');
    updateEncodeButton();
  }
});

document.getElementById('selectVtt').addEventListener('click', async () => {
  const path = await window.api.selectVtt();
  if (path) {
    vttPath = path;
    vttPathEl.textContent = path;
    vttPathEl.classList.add('has-file');
    updateEncodeButton();
  }
});

document.getElementById('selectOutputDir').addEventListener('click', async () => {
  const path = await window.api.selectOutputDir();
  if (path) {
    outputDir = path;
    outputDirPathEl.textContent = path;
    outputDirPathEl.classList.add('has-file');
    updateEncodeButton();
  }
});

// Subscribe to ffmpeg stderr stream - appends output live to textarea
window.api.onFfmpegOutput((data) => {
  outputEl.textContent += data;
  // Auto-scroll to bottom
  outputEl.scrollTop = outputEl.scrollHeight;
});

// Encode button handler
encodeBtn.addEventListener('click', async () => {
  // Clear previous output and status
  outputEl.textContent = '';
  statusEl.textContent = '';
  statusEl.className = '';

  // Disable button during encoding
  encodeBtn.disabled = true;
  encodeBtn.textContent = 'Encoding...';

  // Call main process to run ffmpeg
  const result = await window.api.encode(mp4Path, vttPath, outputDir);

  // Show result
  if (result.success) {
    statusEl.textContent = `Success: ${result.outputPath}`;
    statusEl.className = 'success';
  } else {
    statusEl.textContent = `Error: ${result.error}`;
    statusEl.className = 'error';
  }

  // Re-enable button
  encodeBtn.disabled = false;
  encodeBtn.textContent = 'Encode';
});
