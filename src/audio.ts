import type { App } from "./app";
import FFT from "fft.js";

export class AudioEngine {
  private _app: App;
  public onplay: () => void;
  public spectrum: number[][];
  public player: HTMLAudioElement;

  constructor(app: App) {
    this._app = app;
    this.onplay = () => {};
    this.spectrum = [];
    this.player = document.createElement("audio");
  }

  public get controls() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("audio-wrapper");

    this.player.controls = true;
    this.player.volume = 0.1;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.onchange = (ev) => this._onFileChanged(ev);

    wrapper.append(this.player, fileInput);

    return wrapper;
  }

  public getDelayedSpectrum(delay: number) {
    const frame = Math.floor(Math.max(0, this.player.currentTime - delay) * 60);
    return this.spectrum[frame];
  }

  private async _onFileChanged(e: Event) {
    const target = e.target as HTMLInputElement;

    if (!target.files) return;

    const file = target.files[0];

    this._app.statusBar.writeStatus("Decoding Audio");

    const data = await file.arrayBuffer();
    const context = new AudioContext();
    const buffer = await context.decodeAudioData(data);

    this.player.src = URL.createObjectURL(file);
    this.player.onplay = this.onplay;

    this.spectrum = this._computeSpectrum(buffer);

    this._app.statusBar.writeStatus("Decoding completed");
  }

  private _computeSpectrum(buffer: AudioBuffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const samplesPerFrame = Math.floor(sampleRate / 60);
    const numFrames = Math.ceil(buffer.length / samplesPerFrame);

    const fft = new FFT(1024);
    const input = new Array(1024).fill(0);
    const output = fft.createComplexArray();

    const spectra = [];

    for (let frame = 0; frame < numFrames; frame++) {
      const startSample = frame * samplesPerFrame;

      // mix channels into one frame
      for (let i = 0; i < 1024; i++) {
        input[i] = 0;
        for (let ch = 0; ch < numChannels; ch++) {
          const channelData = buffer.getChannelData(ch);
          if (startSample + i < channelData.length) {
            input[i] += channelData[startSample + i] / numChannels;
          }
        }
      }

      fft.realTransform(output, input);
      fft.completeSpectrum(output);

      // compute magnitude
      const magnitudes = [];
      for (let i = 0; i < 1024 / 2; i++) {
        const re = output[i * 2];
        const im = output[i * 2 + 1];
        magnitudes[i] = Math.sqrt(re * re + im * im);
      }

      spectra.push(magnitudes);
    }

    return spectra;
  }
}
