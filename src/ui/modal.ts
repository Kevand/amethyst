import type { App } from "../app";

export class Modal {
  private e: HTMLDivElement;
  private _app: App;

  constructor(app: App) {
    this.e = document.createElement("div");
    this.e.classList.add("modal");

    this._app = app;
  }

  public show(child: HTMLElement) {
    this.e.innerHTML = "";

    const w = document.createElement("div");
    w.classList.add("modal-window");

    w.append(child);
    this.e.append(w);
    this._app.appElement.append(this.e);

    this.e.onclick = (ev) => {
      if (ev.target == this.e) {
        this.e.remove();
      }
    };

    return () => {
      this.e.remove();
    };
  }
}
