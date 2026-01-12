# HLS Safe Encoder

<img width="761" height="739" alt="Screenshot 2026-01-12 at 10 57 34 AM" src="https://github.com/user-attachments/assets/30b94246-41fa-4ab8-ac41-a0d66d502549" />

**HLS Safe Encoder** is a macOS desktop app for re-encoding MP4 files with burned-in WebVTT subtitles and HLS-friendly keyframe alignment.

It’s designed for situations where subtitle timing, keyframe placement, or encoding parameters cause playback issues in HLS pipelines—especially when captions must be rendered directly into the video.

---

## Features

- Burns **WebVTT (.vtt)** subtitles directly into video frames
- Re-encodes MP4 files with **HLS-safe GOP and keyframe settings**
- Produces fast-start MP4 output optimized for streaming
- Simple macOS UI (Electron)
- Uses your system-installed **FFmpeg**

---

## Why This Exists

In many HLS workflows:

- WebVTT subtitle tracks can drift or misalign
- GOPs don’t line up cleanly with segment boundaries
- Some players handle subtitle tracks inconsistently

This tool avoids those issues by:

- Rendering captions into the video itself
- Forcing constant frame rate and fixed GOP size
- Disabling scene-cut keyframes
- Producing predictable, player-friendly output

---

## Requirements

- macOS
- **FFmpeg** installed on the system (Homebrew recommended)

```bash
brew install ffmpeg
```

##### Homebrew installation instructions (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

[https://brew.sh/](https://brew.sh/)

---

## Installation

1. Go to the **Releases** section on this GitHub page
2. Download the latest `.dmg`
3. Open the DMG and drag **HLS Safe Encoder** to your Applications folder
4. Launch the app

The app is signed and notarized for macOS.

---

## How to Use

1. Launch **HLS Safe Encoder**
2. Select an **MP4** file
3. Select a **VTT** subtitle file
4. Choose an **output directory**
5. Click **Encode**

The app will generate:

```
<original_filename>_hls_safe.mp4
```

---

## Encoding Details

### Video

- Codec: H.264 (`libx264`)
- Profile: `main`
- Level: `4.0`
- Constant frame rate (CFR)
- Frame rate: `24`
- GOP size: `96`
- Scene-cut disabled
- Closed GOPs
- Repeated headers
- Pixel format: `yuv420p`

### Audio

- Codec: AAC
- Sample rate: 48 kHz
- Channels: Stereo
- Bitrate: 128 kbps

### Output

- Fast-start MP4 (`+faststart`)
- Subtitles burned directly into video frames

---

## Security Model

- Renderer process has **no Node.js access**
- `contextIsolation` enabled
- All filesystem and process access handled in the main process
- Explicit IPC boundaries only

---

## Notes & Limitations

- FFmpeg is **not bundled** with the app
- Subtitles are burned in (no selectable subtitle tracks)
- Optimized for streaming reliability rather than archival quality
- Tested primarily on Apple Silicon Macs

---

## Development

This project is an Electron app with:

- A minimal main process (`main.js`)
- A preload script for secure IPC
- A simple HTML/JS renderer

To run locally:

```bash
npm install
npm start
```

---

## License

### MIT License

Copyright (c) 2025 John Given

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
