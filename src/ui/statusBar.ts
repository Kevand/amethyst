export class StatusBar {
  private _e: HTMLDivElement;

  constructor() {
    this._e = document.createElement("div");
    this._e.classList.add("status-bar");
  }

  public get view() {
    return this._e;
  }

  public writeStatus(text: string) {
    this._e.innerText = text;
  }
}
