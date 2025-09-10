import type { App } from "../app";

export class ContextMenu {
  private _e: HTMLDivElement;
  private _app: App;
  private _content: HTMLElement | undefined;

  constructor(app: App) {
    this._e = document.createElement("div");
    this._e.classList.add("context-menu");
    this._app = app;

    this._app.appElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this._show(e.clientX, e.clientY);
    });

    this._app.appElement.addEventListener("click", (e) => {
      if (e.target !== this._e) {
        this.close();
      }
    });
  }

  public set content(val: HTMLElement) {
    this._content = val;
  }

  /** Manual closing function, to close after specific action */
  public close() {
    this._content = undefined;
    this._e.remove();
  }

  private _show(x: number, y: number) {
    if (!this._content) return;

    this._e.innerHTML = "";
    this._e.style.top = `${y}px`;
    this._e.style.left = `${x}px`;
    this._e.append(this._content ?? "");
    this._app.appElement.append(this._e);
  }
}
