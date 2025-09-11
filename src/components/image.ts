import type { App } from "../app";
import { Component } from "./component";

export class ImageComponent extends Component {
  public image: HTMLImageElement;

  constructor(app: App, key: string) {
    super(app, key);
    this.image = new Image();

    const self = this;

    this.properties.set("source", {
      name: "Source",
      type: "image",
      value: "",
      onChange(val) {
        self.image.src = val;
      },
    });

    this.properties.set("scale", {
      name: "Scale",
      type: "number",
      value: 1,
      min: 0,
      max: 100,
      step: 0.01,
    });

    this.properties.set("bass-react", {
      name: "Bass React",
      type: "number",
      value: 0,
      min: 0,
      max: 100,
      step: 0.01,
    });

    this.properties.set("bass-shake", {
      name: "Bass Shake",
      type: "boolean",
      value: false,
    });

    this.properties.set("max-shake", {
      name: "Max Shake",
      type: "number",
      value: 1,
      min: 0,
      max: 10,
      step: 0.1,
    });
  }

  public clone() {
    const c = new ImageComponent(this.app, this.key);
    c.image = this.image;
    c.properties = Object.assign({}, this.properties);
    return c;
  }

  private _prevShakeX = 0;
  private _prevShakeY = 0;
  private _shakeSmoothing = 0.95;

  draw(ctx: CanvasRenderingContext2D): void {
    const positionX = this.properties.get("position-x")?.value as number;
    const positionY = this.properties.get("position-y")?.value as number;
    const scale = this.properties.get("scale")?.value as number;
    const bassReact = this.properties.get("bass-react")?.value as number;
    const maxShake = this.properties.get("max-shake")?.value as number;
    const bassShake = this.properties.get("bass-shake")?.value as boolean;

    const bassValue = this.app.engine.bass * (bassReact / 100);

    // Shake offsets
    const shakeX =
      this._shakeSmoothing * this._prevShakeX +
      (1 - this._shakeSmoothing) *
        (Math.random() * 2 - 1) *
        bassValue *
        maxShake;
    const shakeY =
      this._shakeSmoothing * this._prevShakeY +
      (1 - this._shakeSmoothing) *
        (Math.random() * 2 - 1) *
        bassValue *
        maxShake;
    this._prevShakeX = shakeX;
    this._prevShakeY = shakeY;

    ctx.save();

    let bassedScale = scale + bassValue;

    if (bassShake) {
      ctx.translate(positionX + shakeX, positionY + shakeY);
    } else {
      ctx.translate(positionX, positionY);
    }

    ctx.drawImage(
      this.image,
      (-this.image.width / 2) * bassedScale,
      (-this.image.height / 2) * bassedScale,
      this.image.width * bassedScale,
      this.image.height * bassedScale
    );

    ctx.restore();
  }
}
