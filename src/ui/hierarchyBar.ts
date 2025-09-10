import type { App } from "../app";
import type { Component } from "../components/component";

export class HierarchyBar {
  private e: HTMLDivElement;
  private _app: App;

  constructor(app: App) {
    this.e = document.createElement("div");
    this.e.classList.add("hierarchy-bar");

    const renderList = (data: Component[]) => {
      this.e.innerHTML = "";

      for (let i = 0; i < data.length; i++) {
        const c = data[i];

        const b = document.createElement("button");
        b.innerText = c.properties.get("name")!.value as string;
        c.on<string>("namechanged", (val) => {
          b.innerText = val;
        });
        b.onclick = () => {
          this._app.optionsBar.setComponent(c);
        };
        b.oncontextmenu = () => {
          const contextMenu = document.createElement("div");
          contextMenu.classList.add("context-menu-component");

          const deleteButton = document.createElement("button");
          deleteButton.innerText = "Delete";
          deleteButton.onclick = () => {
            this._app.removeComponent(i);
            this._app.optionsBar.setComponent(null);
            contextMenu.remove();
          };

          contextMenu.append(deleteButton);

          this._app.contextMenu.content = contextMenu;
        };
        this.e.append(b);
      }
    };

    app.on<Component[]>("componentlistchanged", (data) => {
      renderList(data);
    });

    this._app = app;
  }

  get view() {
    return this.e;
  }
}
