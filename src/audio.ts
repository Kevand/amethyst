import type { App } from "./app";
import FFT from "fft.js";

export class AudioEngine {
  public onplay: () => void;
  public spectrum: number[][];
  public player: HTMLAudioElement;
  public audioFile: null | File;

  private _app: App;
  private _rAF: number;
  private _slider: HTMLInputElement;
  private _timeInfo: HTMLSpanElement;
  private _songName: HTMLSpanElement;

  constructor(app: App) {
    this.audioFile = null;
    this._app = app;
    this.onplay = () => {};
    this.spectrum = [];
    this.player = document.createElement("audio");
    this._rAF = 0;
    this._slider = document.createElement("input");
    this._timeInfo = document.createElement("span");
    this._songName = document.createElement("span");
  }

  public setTime(seconds: number) {
    this.player.currentTime = seconds;
  }

  public smoothedSpectrum: number[] = [];

  public get bass() {
    const s = this.getSpectrum();
    if (this.smoothedSpectrum.length !== s.length) {
      for (let i = 0; i < s.length; i++) this.smoothedSpectrum[i] = 0;
    }
    for (let i = 0; i < s.length; i++) {
      this.smoothedSpectrum[i] =
        0.95 * this.smoothedSpectrum[i] + (1 - 0.95) * s[i];
    }

    let avg = 0;

    const vals = this.smoothedSpectrum.slice(0, 16);

    for (let i = 0; i < vals.length; i++) {
      avg += vals[i];
    }

    avg /= vals.length;

    return avg;
  }

  private _whilePlaying() {
    this._setSlider();
    this._rAF = requestAnimationFrame(() => this._whilePlaying());
  }

  private _calcTime(secs: number) {
    const totalMinutes = Math.floor(secs / 60);
    const totalSeconds = Math.floor(secs % 60);

    return `${totalMinutes}:${totalSeconds.toString().padStart(2, "0")}`;
  }

  public get controls() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("audio-wrapper");

    const playButton = document.createElement("button");
    playButton.classList.add("material-symbols-outlined");
    playButton.innerText = "play_circle";
    playButton.onclick = () => {
      if (!this.player.src || this.player.src.length === 0) return;

      if (this.player.paused) {
        this.player.play();
        requestAnimationFrame(() => this._whilePlaying());
        playButton.innerHTML = "pause_circle";
      } else {
        this.player.pause();
        cancelAnimationFrame(this._rAF);
        playButton.innerText = "play_circle";
      }
    };

    this._timeInfo.innerText = `0:00/0:00`;

    this.player.addEventListener("timeupdate", () => {
      this._setSlider();
      this._setTimeInfo();
    });

    this.player.addEventListener("loadedmetadata", () => {
      this._setTimeInfo();
      this._setSlider();
      this._slider.max = Math.floor(this.player.duration).toString();
    });

    this.player.addEventListener("ended", () => {
      playButton.innerText = "▶";
      cancelAnimationFrame(this._rAF);
    });

    this._slider.type = "range";
    this._slider.min = "0";
    this._slider.max = "0";
    this._slider.value = "0";

    this._slider.onchange = () => {
      this.player.currentTime = parseFloat(this._slider.value);
      if (!this.player.paused) {
        requestAnimationFrame(() => this._whilePlaying());
      }
    };

    this._slider.oninput = () => {
      if (!this.player.paused) {
        cancelAnimationFrame(this._rAF);
      }
    };

    this.player.volume = 0.05;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/*";
    fileInput.onchange = (ev) => this._onFileChanged(ev);
    fileInput.hidden = true;

    const selectFileButton = document.createElement("button");
    selectFileButton.innerText = "Select File";
    selectFileButton.classList.add("select-file-button");
    selectFileButton.onclick = () => {
      fileInput.click();
    };

    wrapper.append(
      this._songName,
      playButton,
      this._timeInfo,
      this._slider,
      fileInput,
      selectFileButton
    );

    return wrapper;
  }

  public getDelayedSpectrum(delay: number) {
    const frame = Math.floor(Math.max(0, this.player.currentTime - delay) * 60);
    return this.spectrum[frame];
  }

  private _setTimeInfo() {
    this._timeInfo.innerText = `${this._calcTime(
      this.player.currentTime
    )}/${this._calcTime(this.player.duration)}`;
  }

  private _setSlider() {
    this._slider.value = this.player.currentTime.toString();
  }

  public get frame() {
    return Math.floor(this.player.currentTime * 60);
  }

  public getSpectrum() {
    const frame = Math.floor(this.player.currentTime * 60);
    return this.spectrum[frame];
  }

  private async _onFileChanged(e: Event) {
    const target = e.target as HTMLInputElement;

    if (!target.files) return;

    const file = target.files[0];

    this.audioFile = file;

    this._app.statusBar.writeStatus("Decoding Audio");

    const data = await file.arrayBuffer();
    const context = new AudioContext();
    const buffer = await context.decodeAudioData(data);

    this.player.src = URL.createObjectURL(file);
    this.player.onplay = this.onplay;
    this._songName.innerText = file.name;

    this.spectrum = this._computeSpectrum(buffer);

    this._app.statusBar.writeStatus("Decoding completed");
  }

  private _computeSpectrum(buffer: AudioBuffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const samplesPerFrame = Math.floor(sampleRate / 60);
    const numFrames = Math.ceil(buffer.length / samplesPerFrame);

    const fft = new FFT(4096);
    const input = new Array(4096).fill(0);
    const output = fft.createComplexArray();

    const spectra = [];

    for (let frame = 0; frame < numFrames; frame++) {
      const startSample = frame * samplesPerFrame;

      // mix channels into one frame
      for (let i = 0; i < 4096; i++) {
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
      for (let i = 0; i < 4096 / 2; i++) {
        const re = output[i * 2];
        const im = output[i * 2 + 1];
        magnitudes[i] = Math.sqrt(re * re + im * im);
      }

      spectra.push(magnitudes);
    }

    return spectra;
  }
}
