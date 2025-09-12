import type { App } from "../app";
import type { Component } from "../components/component";

export class OptionsBar {
  private e: HTMLDivElement;
  //private _app: App;

  constructor(_: App) {
    this.e = document.createElement("div");
    this.e.classList.add("options-bar");
    //this._app = app;
  }

  setComponent(c: Component | null) {
    this.e.innerHTML = "";

    if (c === null) return;

    for (const [key, val] of c.properties) {
      const wrapper = document.createElement("label");
      wrapper.append(val.name);

      const input = document.createElement("input");

      switch (val.type) {
        case "image": {
          input.type = "file";
          input.accept = "image/*";

          input.onchange = async () => {
            const file = input.files![0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = (e) => {
              const base64 = e.target!.result!.toString();

              if (val.onChange) {
                val.onChange(base64);
              }

              c.properties.get(key)!.value = base64;
            };

            reader.readAsDataURL(file);
          };

          break;
        }
        case "string": {
          input.type = "text";
          input.value = val.value;

          input.onchange = () => {
            if (val.onChange) {
              val.onChange(input.value);
            }

            c.properties.get(key)!.value = input.value;
          };

          break;
        }
        case "number": {
          input.type = "number";
          input.max = val.max.toString();
          input.value = val.value.toString();
          input.min = val.min.toString();
          input.step = val.step.toString();

          input.onchange = () => {
            if (val.onChange) {
              val.onChange(parseFloat(input.value));
            }

            c.properties.get(key)!.value = parseFloat(input.value);
          };

          break;
        }

        case "boolean": {
          input.type = "checkbox";
          input.checked = val.value;

          input.onchange = () => {
            c.properties.get(key)!.value = input.checked;
          };

          break;
        }

        case "color": {
          input.type = "color";
          input.value = val.value;

          input.onchange = () => {
            c.properties.get(key)!.value = input.value;
          };

          break;
        }
      }

      wrapper.append(input);
      this.e.append(wrapper);
    }
  }

  get view() {
    return this.e;
  }
}
