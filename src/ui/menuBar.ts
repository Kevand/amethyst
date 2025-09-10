import type { App } from "../app";
import logoSrc from "../../public/logo.svg";
import { legacyRender } from "../render";
import type { SaveFile } from "../helpers";

export class MenuBar {
  private e: HTMLDivElement;
  private _app: App;

  constructor(app: App) {
    this.e = document.createElement("div");
    this.e.classList.add("menu-bar");
    this._app = app;
  }

  //TODO: Refactor this shit
  get view() {
    const logo = new Image();
    logo.src = logoSrc;
    this.e.append(logo);

    const addMenuBtn = document.createElement("button");
    addMenuBtn.innerText = "Add";

    const addMenu = document.createElement("div");

    for (const [key, comp] of Array.from(
      this._app.componentRegistry.entries()
    )) {
      const addCompBtn = document.createElement("button");
      addCompBtn.innerText = key;
      addCompBtn.onclick = () => {
        this._app.addComponent(new comp(this._app, key));
      };
      addMenu.append(addCompBtn);
    }

    addMenuBtn.append(addMenu);

    const saveButton = document.createElement("button");
    saveButton.innerText = "Save";

    saveButton.onclick = () => {
      this._app.savePreset();
    };

    const loadButton = document.createElement("button");
    loadButton.innerText = "Load";

    let selectedSave = "";

    const self = this;

    loadButton.onclick = () => {
      function renderList() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("modal-load");

        const saves = document.createElement("div");

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);

          if (key && key.startsWith("save_")) {
            const json = JSON.parse(localStorage.getItem(key)!) as SaveFile;

            const b = document.createElement("button");

            const name = document.createElement("p");
            name.innerText = key.substring(5, key.length);

            const thumbnail = document.createElement("img");
            thumbnail.src = json.thumbnail;

            const timestamp = document.createElement("span");
            timestamp.innerText = json.timestamp;

            b.append(thumbnail, name, timestamp);
            b.onclick = () => {
              if (selectedSave == key) {
                selectedSave = "";
              } else {
                saves.querySelectorAll("button").forEach((b) => {
                  b.classList.remove("selected");
                });

                selectedSave = key;
              }
              b.classList.toggle("selected");
            };
            b.oncontextmenu = () => {
              const contextMenu = document.createElement("div");
              contextMenu.classList.add("context-menu-save");

              const deleteButton = document.createElement("button");
              deleteButton.innerText = "Delete";
              deleteButton.onclick = () => {
                localStorage.removeItem(key);
                renderList();
                contextMenu.remove();
              };

              const downloadButton = document.createElement("button");
              downloadButton.innerText = "Download";
              downloadButton.onclick = () => {
                var dataStr =
                  "data:text/json;charset=utf-8," +
                  encodeURIComponent(JSON.stringify(json));

                const a = document.createElement("a");
                a.href = dataStr;
                a.download = key.substring(5, key.length) + ".json";
                a.click();
              };

              contextMenu.append(deleteButton, downloadButton);

              self._app.contextMenu.content = contextMenu;
            };

            saves.append(b);
          }
        }

        const confirmButton = document.createElement("button");
        confirmButton.innerText = "Load";
        confirmButton.classList.add("confirm-button");

        const loadFromFileButton = document.createElement("button");
        loadFromFileButton.innerText = "From File";
        loadFromFileButton.classList.add("confirm-button");

        loadFromFileButton.onclick = () => {
          const inp = document.createElement("input");
          inp.type = "file";
          inp.hidden = true;
          inp.accept = "application/json";
          inp.click();

          inp.onchange = async () => {
            if (!inp.files) return;

            const file = inp.files[0]!;

            const content = await file.text();

            const success = self._app.loadPreset(file.name, content);

            if (success) {
              localStorage.setItem(`save_${file.name}`, content);
            }

            closeModal();
          };
        };

        wrapper.append(saves, confirmButton, loadFromFileButton);
        const closeModal = self._app.modal.show(wrapper);

        confirmButton.onclick = () => {
          if (selectedSave.length === 0) {
            closeModal();
            return;
          }

          self._app.loadPreset(selectedSave);

          closeModal();
        };
      }

      renderList();
    };

    const renderButton = document.createElement("button");
    renderButton.innerText = "Render";
    renderButton.onclick = () => {
      legacyRender(this._app);
    };

    this.e.append(addMenuBtn, saveButton, loadButton);
    this.e.append(this._app.engine.controls, renderButton);

    return this.e;
  }
}
