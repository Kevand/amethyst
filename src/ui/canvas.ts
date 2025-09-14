import type { App } from "../app";

export class Canvas {
  private e: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _app: App;

  constructor(app: App) {
    this.e = document.createElement("canvas");
    this.ctx = this.e.getContext("2d") as CanvasRenderingContext2D;
    this.e.classList.add("canvas");
    this.e.width = 1920;
    this.e.height = 1080;

    this._app = app;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.e.width, this.e.height);

    if (this._app.engine.getSpectrum()) {
      for (const c of this._app.components) {
        if (!c.visible) continue;
        c.update(this._app.engine.frame);
        c.draw();

        this.ctx.drawImage(c.canvas, 0, 0);
      }
    }

    requestAnimationFrame(() => this.draw());
  }

  get view() {
    return this.e;
  }
}
