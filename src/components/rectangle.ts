import type { App } from "../app";
import { Component } from "./component";

export class RectangleComponent extends Component {
  constructor(app: App, key: string) {
    super(app, key);

    this.properties.set("width", {
      name: "Width",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });

    this.properties.set("Height", {
      name: "Height",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });

    this.properties.set("color", {
      name: "Color",
      type: "color",
      value: "#222222",
    });
  }

  public clone() {
    const c = new RectangleComponent(this.app, this.key);
    c.properties = Object.assign({}, this.properties);
    return c;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const posX = this.getProperty<number>("position-x");
    const posY = this.getProperty<number>("position-y");
    const anchorX = this.getProperty<number>("width");
    const anchorY = this.getProperty<number>("height");
    const color = this.getProperty<string>("color");

    ctx.fillStyle = color;

    ctx.fillRect(posX, posY, anchorX, anchorY);
  }
}
