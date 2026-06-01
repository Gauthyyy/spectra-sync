# SpectraSync

SpectraSync is a real-time browser-based audio DSP analyzer built with the Web Audio API and Canvas.
It captures microphone input, renders a live oscilloscope, and shows a frequency spectrum with a dB meter.

## Launch

This app requires a secure origin for microphone access. Run it from a local server or HTTPS.

### Option 1: Python built-in server

```bash
cd c:\Users\gauja\Documents\Projects\spectra-sync
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: Node.js `http-server`

```bash
cd c:\Users\gauja\Documents\Projects\spectra-sync
npx http-server -p 8000
```

Then open:

```text
http://localhost:8000
```

### Option 3: VS Code Live Server

Install the Live Server extension, then open `index.html` and click **Go Live**.

## Usage

1. Click **Start**.
2. Allow microphone access.
3. Speak, play audio, or move sound near the mic.
4. Adjust the FFT size if you want more or less frequency resolution.

## Files

- `index.html` — app UI
- `styles.css` — dark mode styling and layouts
- `app.js` — Web Audio setup, analyser routing, and real-time canvas rendering
