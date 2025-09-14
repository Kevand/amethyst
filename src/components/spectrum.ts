import type { App } from "../app";
import { easeInOutSine, lerp } from "../helpers";
import { Component } from "./component";

export class AudioSpectrum extends Component {
  constructor(app: App, key: string) {
    super(app, key);

    this.properties.set("anchor-x", {
      name: "Anchor X",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });

    this.properties.set("anchor-y", {
      name: "Anchor Y",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });

    this.properties.set("amplitude", {
      name: "Amplitude",
      type: "number",
      min: 0,
      max: 10,
      step: 0.1,
      value: 1,
    });

    this.properties.set("reverse", {
      name: "Reverse",
      type: "boolean",
      value: false,
    });

    this.properties.set("bar-count", {
      name: "Bar Count",
      type: "number",
      min: 1,
      max: 2048,
      step: 1,
      value: 256,
    });

    this.properties.set("start-freq", {
      name: "Start Frequency",
      type: "number",
      min: 0,
      max: 512,
      step: 1,
      value: 0,
    });

    this.properties.set("end-freq", {
      name: "End Frequency",
      type: "number",
      min: 0,
      max: 512,
      step: 1,
      value: 512,
    });
    this.properties.set("thickness", {
      name: "Thickness",
      type: "number",
      min: 0,
      max: 128,
      step: 1,
      value: 5,
    });

    this.properties.set("color", {
      name: "Color",
      type: "color",
      value: "#ffffff",
    });

    this.properties.set("delay", {
      name: "Delay",
      type: "number",
      min: 0,
      max: 5000,
      value: 0,
      step: 1,
    });

    this.properties.set("smoothing-factor", {
      name: "Smoothing Factor",
      type: "number",
      min: 0,
      max: 1,
      value: 0.95,
      step: 0.05,
    });
  }

  private smoothedSpectrum: number[] = [];
  private smoothSpectrum(s: number[]) {
    const smoothingFactor = this.getProperty<number>("smoothing-factor");

    if (this.smoothedSpectrum.length !== s.length) {
      for (let i = 0; i < s.length; i++) this.smoothedSpectrum[i] = 0;
    }
    for (let i = 0; i < s.length; i++) {
      this.smoothedSpectrum[i] =
        smoothingFactor * this.smoothedSpectrum[i] +
        (1 - smoothingFactor) * s[i];
    }
  }

  public clone() {
    const c = new AudioSpectrum(this.app, this.key);
    c.clearAll();
    c.properties = Object.assign({}, this.properties);
    return c;
  }

  private cutSpectrum() {
    const start = this.properties.get("start-freq")!.value as number;
    const end = this.properties.get("end-freq")!.value as number;

    return this.smoothedSpectrum.slice(start, end);
  }

  private averageToLength() {
    const spectrum = this.cutSpectrum();
    const baseLength = 2048;

    const fillCount = Math.floor(baseLength / spectrum.length);

    const out: number[] = [];

    for (let i = 0; i < baseLength; i += fillCount) {
      const value = spectrum[i / fillCount];
      const nextValue = spectrum[i / fillCount + 1] ?? 0;

      for (let x = 0; x < fillCount; x++) {
        out.push(lerp(value, nextValue, easeInOutSine(x / fillCount)));
      }
    }

    return out;
  }

  private barCountAverage() {
    const targetCount = this.properties.get("bar-count")!.value as number;
    const spectrum = this.averageToLength();

    const out: number[] = [];

    const step = Math.floor(spectrum.length / targetCount);

    for (let i = 0; i < targetCount; i++) {
      let avg = 0;

      for (let x = 1; x < step + 1; x++) {
        avg += spectrum[i * x];
      }

      avg /= step;
      out.push(avg);
    }

    return out;
  }

  private getAngle() {
    const positionX = this.properties.get("position-x")!.value as number;
    const positionY = this.properties.get("position-y")!.value as number;
    const anchorX = this.properties.get("anchor-x")!.value as number;
    const anchorY = this.properties.get("anchor-y")!.value as number;

    return Math.atan2(anchorY - positionY, anchorX - positionX) - Math.PI / 2;
  }

  draw(): void {
    const delay = this.properties.get("delay")!.value as number;

    this.smoothSpectrum(this.app.engine.getDelayedSpectrum(delay));

    const amplitude = this.properties.get("amplitude")!.value as number;
    const barCount = this.properties.get("bar-count")!.value as number;
    const thickness = this.properties.get("thickness")!.value as number;

    const positionX = this.properties.get("position-x")!.value as number;
    const positionY = this.properties.get("position-y")!.value as number;
    const anchorX = this.properties.get("anchor-x")!.value as number;
    const anchorY = this.properties.get("anchor-y")!.value as number;

    const reverse = this.properties.get("reverse")!.value as boolean;
    const color = this.properties.get("color")!.value as string;

    let spectrum = this.barCountAverage();

    const angle = this.getAngle();

    if (reverse) {
      spectrum.reverse();
    }

    this._ctx.strokeStyle = color;

    for (let i = 0; i < barCount; i++) {
      const x = lerp(positionX, anchorX, i / barCount);
      const y = lerp(positionY, anchorY, i / barCount);

      this._ctx.lineWidth = thickness;
      this._ctx.beginPath();

      this._ctx.moveTo(x, y);
      this._ctx.lineTo(
        x + Math.cos(angle) * spectrum[i] * amplitude,
        y + Math.sin(angle) * spectrum[i] * amplitude
      );
      this._ctx.stroke();
    }
  }
}
