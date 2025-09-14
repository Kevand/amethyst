import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { AudioEngine } from "./audio";
import type { Component } from "./components/component";
import { ImageComponent } from "./components/image";
import { AudioSpectrum } from "./components/spectrum";
import { EventEmitter, type SaveComponent, type SaveFile } from "./helpers";
import { Canvas } from "./ui/canvas";
import { HierarchyBar } from "./ui/hierarchyBar";
import { MenuBar } from "./ui/menuBar";
import { Modal } from "./ui/modal";
import { OptionsBar } from "./ui/optionsBar";
import { StatusBar } from "./ui/statusBar";
import { ParticlesComponent } from "./components/particles";
import { RectangleComponent } from "./components/rectangle";
import { ContextMenu } from "./ui/contextmenu";
import { RadialSpectrum } from "./components/radialspectrum";

export class App extends EventEmitter {
  public appElement: HTMLDivElement;

  public statusBar: StatusBar;
  public menuBar: MenuBar;
  public hierarchyBar: HierarchyBar;
  public optionsBar: OptionsBar;
  public canvas: Canvas;
  public engine: AudioEngine;
  public componentRegistry: Map<string, typeof Component>;
  public components: Component[];
  public componentIdCounter: number;
  public modal: Modal;
  public ffmpeg: FFmpeg;
  public contextMenu: ContextMenu;

  constructor() {
    super();

    this.appElement = document.createElement("div");
    this.appElement.classList.add("app");

    this.ffmpeg = new FFmpeg();
    this.statusBar = new StatusBar();
    this.menuBar = new MenuBar(this);
    this.hierarchyBar = new HierarchyBar(this);
    this.optionsBar = new OptionsBar(this);
    this.canvas = new Canvas(this);
    this.engine = new AudioEngine(this);
    this.modal = new Modal(this);
    this.contextMenu = new ContextMenu(this);
    this.componentRegistry = new Map();
    this.components = [];
    this.componentIdCounter = 1;
    this.registerComponents();
  }

  private registerComponents() {
    this.componentRegistry.set("audio-spectrum", AudioSpectrum);
    this.componentRegistry.set("radial-spectrum", RadialSpectrum);
    this.componentRegistry.set("image", ImageComponent);
    this.componentRegistry.set("particles", ParticlesComponent);
    this.componentRegistry.set("rectangle", RectangleComponent);
  }

  public addComponent(c: Component) {
    this.components.push(c);
    this.emit("componentlistchanged", this.components);
    c.on("layerchanged", () => {
      this.components = this.components.sort((a, b) => {
        return a.getProperty<number>("layer") - b.getProperty<number>("layer");
      });

      this.emit("componentlistchanged", this.components);
    });
  }

  public removeComponent(index: number) {
    this.components.splice(index, 1);
    this.emit("componentlistchanged", this.components);
  }

  public async loadFFmpeg() {
    this.ffmpeg.on("log", ({ type, message }) => {
      console.log(`[${type}]`, message);
    });

    this.ffmpeg.on("progress", ({ progress }) => {
      this.statusBar.writeStatus(`Rendering: ${(progress * 100).toFixed(1)}`);
    });

    const baseURL =
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm";

    await this.ffmpeg.load({
      coreURL: await toBlobURL(baseURL + "/ffmpeg-core.js", "text/javascript"),
      wasmURL: await toBlobURL(
        baseURL + "/ffmpeg-core.wasm",
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        baseURL + "/ffmpeg-core.worker.js",
        "text/javascript"
      ),
    });

    this.statusBar.writeStatus("FFMpeg Loaded");
  }

  public saveComponent(c: Component): SaveComponent {
    const props = Array.from(c.properties.entries());

    return {
      key: c.key,
      props,
    };
  }

  public loadComponent(comp: SaveComponent) {
    const c = this.componentRegistry.get(comp.key);
    if (!c) return;

    const newComp = new c(this, comp.key);

    for (const [key, val] of comp.props) {
      newComp.properties.set(key, val);

      // Workaround for an image component, can't find a better way
      if (newComp instanceof ImageComponent && key == "source") {
        newComp.image.src = val.value as string;
      }
    }

    this.addComponent(newComp);
  }

  public loadPreset(name: string, textContent: string = "") {
    let json: string | null;

    if (textContent.length === 0) {
      json = localStorage.getItem(name);
    } else {
      json = textContent;
    }

    if (!json) return false;

    const saveFile = JSON.parse(json) as SaveFile;
    this.components = [];

    for (const comp of saveFile.components) {
      this.loadComponent(comp);
    }

    this.components = this.components.sort((a, b) => {
      return a.getProperty<number>("layer") - b.getProperty<number>("layer");
    });

    return true;
  }

  public duplicateComponent(c: Component) {
    // First save to string, then load from string, weird way but diffrent ways didn't work :/
    const save = JSON.stringify(this.saveComponent(c));
    this.loadComponent(JSON.parse(save));
  }

  public savePreset() {
    const saveNameInput = document.createElement("input");
    saveNameInput.placeholder = "save name";

    const confirmButton = document.createElement("button");
    confirmButton.innerText = "Save";

    const wrapper = document.createElement("div");
    wrapper.classList.add("modal-save");
    wrapper.append(saveNameInput, confirmButton);

    const date = new Date();
    const timestamp = date.toLocaleString();
    const thumbnail = this.canvas.view.toDataURL();

    let save: SaveFile = {
      timestamp,
      thumbnail,
      components: [],
    };

    const closeModal = this.modal.show(wrapper);

    confirmButton.onclick = () => {
      closeModal();

      const comps = this.components;

      let list: SaveComponent[] = [];

      for (const c of comps) {
        list.push(this.saveComponent(c));
      }

      save.components.push(...list);

      const text = JSON.stringify(save);

      let name = saveNameInput.value;
      if (name.length === 0) {
        name = `Save from ${timestamp}`;
      }

      localStorage.setItem(`save_${saveNameInput.value}`, text);
    };
  }

  public get view() {
    this.appElement.append(
      this.menuBar.view,
      this.optionsBar.view,
      this.canvas.view,
      this.hierarchyBar.view,
      this.statusBar.view
    );

    this.canvas.draw();

    return this.appElement;
  }
}
