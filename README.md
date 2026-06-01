# SpectraSync

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-native-brightgreen.svg)
![Canvas API](https://img.shields.io/badge/Canvas%20API-HTML5-orange.svg)

A real-time browser-based audio DSP analyzer for live microphone signal visualization. Capture audio input, analyze frequency content via FFT, and display waveforms and spectra with hardware-accelerated Canvas rendering.

## Features

- 🎙️ **Live microphone capture** with browser permission handling
- 📊 **Dual visualization**: time-domain oscilloscope and frequency-domain spectrum analyzer
- 📈 **dBFS meter** for real-time input level monitoring
- 🎛️ **Dynamic FFT configuration** (256, 512, 1024, 2048 bins)
- 🌙 **Dark-mode UI** with modern glass-morphism styling
- ⚡ **60 FPS rendering** via `requestAnimationFrame`
- 🔧 **Modular architecture** with separated audio and rendering logic
- 📦 **Zero dependencies** — pure vanilla JavaScript, HTML5, CSS3

## Prerequisites

- Modern browser with Web Audio API support (Chrome, Firefox, Safari, Edge)
- Microphone access and permission grant
- HTTPS or localhost for `navigator.mediaDevices.getUserMedia`

## Getting Started

### Quick Start (Python)

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

### Alternative: Node.js

```bash
npx http-server -p 8000
```

Open `http://localhost:8000`.

### VS Code Live Server

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**

## Usage

1. Click **Start** to initialize the Web Audio context
2. Grant microphone permissions when prompted
3. Speak, play music, or generate sound near the microphone
4. Use the **FFT Size** dropdown to adjust frequency resolution (higher = more detail, lower = faster response)
5. Monitor the **Input level** meter in real-time
6. Click **Stop** to disconnect the microphone and clean up resources

## Project Structure

```
spectra-sync/
├── index.html         # Application markup and layout
├── styles.css         # Dark-mode styling, panels, and meter UI
├── app.js             # Web Audio API setup, analysis, and rendering
├── README.md          # Documentation
└── .gitignore         # Git configuration
```

## Architecture

### Audio Signal Flow

```
Microphone → getUserMedia() → MediaStreamAudioSourceNode 
  → AnalyserNode (FFT + time-domain) → Canvas rendering
```

### Rendering Pipeline

- **Waveform**: 8-bit time-domain samples with RMS-based dB calculation
- **Spectrum**: 8-bit FFT frequency bins rendered as animated bars
- **Meter**: Real-time dBFS display (−100 to 0 dBFS range)
- **Refresh rate**: 60 FPS (vsync-locked via `requestAnimationFrame`)

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Full |
| Firefox | ✅ Full |
| Safari  | ✅ Full |
| Edge    | ✅ Full |

## License

MIT
