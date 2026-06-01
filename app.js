const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const fftSizeSelect = document.getElementById('fftSizeSelect');
const statusText = document.getElementById('statusText');
const dbMeterFill = document.getElementById('dbMeterFill');
const dbValue = document.getElementById('dbValue');
const waveformCanvas = document.getElementById('waveformCanvas');
const spectrumCanvas = document.getElementById('spectrumCanvas');

const waveformCtx = waveformCanvas.getContext('2d');
const spectrumCtx = spectrumCanvas.getContext('2d');

let audioContext = null;
let analyser = null;
let mediaStream = null;
let sourceNode = null;
let animationFrameId = null;
let timeDomainData = null;
let frequencyData = null;

function getSelectedFftSize() {
  return Number(fftSizeSelect.value) || 1024;
}

function updateUi(isRunning) {
  startButton.disabled = isRunning;
  stopButton.disabled = !isRunning;
  fftSizeSelect.disabled = false;

  const message = isRunning
    ? 'Listening... move your voice or play audio into the mic.'
    : 'Click Start to grant microphone access and begin visualization.';
  setStatus(message);
}

function setStatus(message) {
  if (statusText) {
    statusText.textContent = message;
  }
}

function updateDbMeter(decibels) {
  const clamped = Math.max(-100, Math.min(0, decibels));
  const percent = ((clamped + 100) / 100) * 100;
  if (dbMeterFill) {
    dbMeterFill.style.width = `${percent}%`;
    dbMeterFill.style.background = `linear-gradient(90deg, hsl(${Math.max(140, 220 + clamped)}, 100%, 60%), hsl(${Math.max(0, 60 + clamped)}, 95%, 58%))`;
  }
  if (dbValue) {
    dbValue.textContent = `${clamped.toFixed(1)} dBFS`;
  }
}

function resizeCanvas(canvas, ctx) {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  const displayWidth = Math.floor(width * ratio);
  const displayHeight = Math.floor(height * ratio);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

function createAnalyser(fftSize) {
  analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.minDecibels = -100;
  analyser.maxDecibels = -20;
  analyser.smoothingTimeConstant = 0.85;

  timeDomainData = new Uint8Array(analyser.fftSize);
  frequencyData = new Uint8Array(analyser.frequencyBinCount);
}

async function initializeAudio() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Your browser does not support microphone capture.');
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  sourceNode = audioContext.createMediaStreamSource(mediaStream);
  createAnalyser(getSelectedFftSize());
  sourceNode.connect(analyser);

  updateUi(true);
  startRenderLoop();
}

function stopAudio() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }

  if (analyser) {
    analyser.disconnect();
    analyser = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  timeDomainData = null;
  frequencyData = null;
  updateUi(false);
  clearCanvas(waveformCtx, waveformCanvas);
  clearCanvas(spectrumCtx, spectrumCanvas);
}

function clearCanvas(ctx, canvas) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawWaveform() {
  if (!analyser || !timeDomainData) return;

  analyser.getByteTimeDomainData(timeDomainData);
  resizeCanvas(waveformCanvas, waveformCtx);

  const ratio = window.devicePixelRatio || 1;
  const width = waveformCanvas.width / ratio;
  const height = waveformCanvas.height / ratio;

  waveformCtx.clearRect(0, 0, width, height);

  const background = waveformCtx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, 'rgba(124, 92, 255, 0.18)');
  background.addColorStop(1, 'rgba(4, 5, 10, 0.95)');

  waveformCtx.fillStyle = background;
  waveformCtx.fillRect(0, 0, width, height);

  waveformCtx.lineWidth = 2.5;
  waveformCtx.strokeStyle = '#9a86ff';
  waveformCtx.lineJoin = 'round';
  waveformCtx.lineCap = 'round';
  waveformCtx.beginPath();

  const sliceWidth = width / timeDomainData.length;
  let x = 0;
  let rmsSum = 0;

  for (let i = 0; i < timeDomainData.length; i += 1) {
    const normalized = (timeDomainData[i] - 128) / 128;
    const y = (normalized * height) / 2 + height / 2;
    rmsSum += normalized * normalized;

    if (i === 0) {
      waveformCtx.moveTo(x, y);
    } else {
      waveformCtx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  waveformCtx.stroke();

  const rms = Math.sqrt(rmsSum / timeDomainData.length);
  const db = rms > 0 ? 20 * Math.log10(rms) : -100;
  updateDbMeter(db);
}

function drawSpectrum() {
  if (!analyser || !frequencyData) return;

  analyser.getByteFrequencyData(frequencyData);
  resizeCanvas(spectrumCanvas, spectrumCtx);

  const ratio = window.devicePixelRatio || 1;
  const width = spectrumCanvas.width / ratio;
  const height = spectrumCanvas.height / ratio;

  spectrumCtx.clearRect(0, 0, width, height);

  const background = spectrumCtx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, 'rgba(4, 5, 10, 0.95)');
  background.addColorStop(1, 'rgba(10, 12, 28, 0.95)');
  spectrumCtx.fillStyle = background;
  spectrumCtx.fillRect(0, 0, width, height);

  const barCount = frequencyData.length;
  const barWidth = Math.max(1, width / barCount);

  for (let i = 0; i < barCount; i += 1) {
    const value = frequencyData[i];
    const percent = value / 255;
    const barHeight = percent * height;
    const x = i * barWidth;
    const y = height - barHeight;
    const hue = 220 - (i / barCount) * 180;

    spectrumCtx.fillStyle = `hsla(${hue}, 100%, ${25 + percent * 40}%, 0.95)`;
    spectrumCtx.fillRect(x, y, barWidth * 0.9, barHeight);
  }
}

function renderFrame() {
  drawWaveform();
  drawSpectrum();
  animationFrameId = requestAnimationFrame(renderFrame);
}

function startRenderLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  renderFrame();
}

startButton.addEventListener('click', async () => {
  startButton.disabled = true;
  try {
    await initializeAudio();
  } catch (error) {
    console.error(error);
    alert(`Unable to start audio capture: ${error.message}`);
    startButton.disabled = false;
  }
});

stopButton.addEventListener('click', stopAudio);

fftSizeSelect.addEventListener('change', () => {
  if (!audioContext || !sourceNode) return;

  if (analyser) {
    sourceNode.disconnect();
    analyser.disconnect();
  }

  createAnalyser(getSelectedFftSize());
  sourceNode.connect(analyser);
  startRenderLoop();
});

window.addEventListener('beforeunload', stopAudio);
updateUi(false);


window.addEventListener('beforeunload', stopAudio);
updateUi(false);
