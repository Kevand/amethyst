import { App } from "./app";
import { AudioEngine } from "./audio";
import "./style.css";

const wrapper = document.querySelector("#app") as HTMLDivElement;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
canvas.width = 1920;
canvas.height = 1080;

const app = new App();

const engine = new AudioEngine(app);

window.onload = () => {
  wrapper.append(engine.controls, canvas, app.statusBar.view);
  loop();
};

let smoothSpectrum: number[] = [];
const smoothingFactor = 0.85;
const shakeSmoothing = 0.95; // smooth the shake
const maxShake = 2; // smaller shake
let prevShakeX = 0;
let prevShakeY = 0;
const bassThreshhold = 16;

function draw(frame: number) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const spectrum = engine.spectrum[frame];

  const bassBins = Math.floor(spectrum.length / 18);

  if (smoothSpectrum.length !== bassBins) {
    for (let i = 0; i < bassBins; i++) smoothSpectrum[i] = 0;
  }
  for (let i = 0; i < bassBins; i++) {
    smoothSpectrum[i] =
      smoothingFactor * smoothSpectrum[i] + (1 - smoothingFactor) * spectrum[i];
  }

  // Radial Spectrum

  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = 3;

  let bassSum = 0;
  for (let i = 0; i < bassBins; i++) bassSum += smoothSpectrum[i];
  let bassIntensity = bassSum / bassBins;
  bassIntensity = Math.max(bassIntensity - bassThreshhold, 0) * 3;

  // Shake offsets
  const shakeX =
    shakeSmoothing * prevShakeX +
    (1 - shakeSmoothing) * (Math.random() * 2 - 1) * bassIntensity * maxShake;
  const shakeY =
    shakeSmoothing * prevShakeY +
    (1 - shakeSmoothing) * (Math.random() * 2 - 1) * bassIntensity * maxShake;
  prevShakeX = shakeX;
  prevShakeY = shakeY;

  const cx = canvas.width / 2 + shakeX;
  const cy = canvas.height / 2 + shakeY;

  const radius = 150;
  const amplitude = 1.5;

  const step = Math.PI / smoothSpectrum.length;

  // Main

  ctx.beginPath();

  ctx.moveTo(cx + radius, cy);

  for (let i = 0; i < smoothSpectrum.length; i++) {
    const vectorX = Math.cos(step * i);
    const vectorY = Math.sin(step * i);

    const baseX = vectorX * radius;
    const baseY = vectorY * radius;

    const ampX = vectorX * (smoothSpectrum[i] * amplitude);
    const ampY = vectorY * (smoothSpectrum[i] * amplitude);

    const x = baseX + ampX;
    const y = baseY + ampY;

    ctx.lineTo(cx + x, cy + y);
  }

  for (let i = 0; i < smoothSpectrum.length; i++) {
    const vectorX = Math.cos(step * i - Math.PI);
    const vectorY = Math.sin(step * i - Math.PI);

    const baseX = vectorX * radius;
    const baseY = vectorY * radius;

    const ampX = vectorX * (smoothSpectrum[i] * amplitude);
    const ampY = vectorY * (smoothSpectrum[i] * amplitude);

    const x = baseX + ampX;
    const y = baseY + ampY;

    ctx.lineTo(cx + x, cy + y);
  }

  ctx.fill();

  /*

  const segmentWidth = canvas.width / smoothSpectrum.length;

  ctx.beginPath();
  ctx.moveTo(0, canvas.height);

  for (let i = 0; i < smoothSpectrum.length; i++) {
    ctx.lineTo(i * segmentWidth, canvas.height - smoothSpectrum[i] * 2);
  }

  ctx.lineTo(canvas.width, canvas.height);

  ctx.fill();

  // Inverted

  ctx.beginPath();
  ctx.moveTo(canvas.width, 0);

  for (let i = 0; i < smoothSpectrum.length; i++) {
    ctx.lineTo(canvas.width - i * segmentWidth, smoothSpectrum[i] * 2);
  }

  ctx.lineTo(0, 0);

  ctx.stroke();

  */
}

function loop() {
  if (engine.spectrum.length > 0) {
    const frame = Math.floor(engine.player.currentTime * 60);
    if (frame < engine.spectrum.length) {
      draw(frame);
    }
  }

  requestAnimationFrame(loop);
}
