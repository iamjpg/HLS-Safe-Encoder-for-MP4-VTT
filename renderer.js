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

// Enable encode button only when all inputs are selected
function updateEncodeButton() {
  encodeBtn.disabled = !(mp4Path && vttPath && outputDir);
}

// File selection handlers - call main process via IPC
document.getElementById('selectMp4').addEventListener('click', async () => {
  const path = await window.api.selectMp4();
  if (path) {
    mp4Path = path;
    mp4PathEl.textContent = path;
    updateEncodeButton();
  }
});

document.getElementById('selectVtt').addEventListener('click', async () => {
  const path = await window.api.selectVtt();
  if (path) {
    vttPath = path;
    vttPathEl.textContent = path;
    updateEncodeButton();
  }
});

document.getElementById('selectOutputDir').addEventListener('click', async () => {
  const path = await window.api.selectOutputDir();
  if (path) {
    outputDir = path;
    outputDirPathEl.textContent = path;
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
