import type { App } from "../app";
import { Component } from "./component";

export class RectangleComponent extends Component {
  constructor(app: App, key: string) {
    super(app, key);

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
    const anchorX = this.getProperty<number>("anchor-x");
    const anchorY = this.getProperty<number>("anchor-y");
    const color = this.getProperty<string>("color");

    ctx.fillStyle = color;

    ctx.fillRect(posX, posY, anchorX, anchorY);
  }
}
