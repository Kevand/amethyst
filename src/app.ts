import { FFmpeg } from "@ffmpeg/ffmpeg";
import { AudioEngine } from "./audio";
import type { Component } from "./components/component";
import { ImageComponent } from "./components/image";
import { AudioSpectrum } from "./components/spectrum";
import { EventEmitter, type SaveFile } from "./helpers";
import { Canvas } from "./ui/canvas";
import { HierarchyBar } from "./ui/hierarchyBar";
import { MenuBar } from "./ui/menuBar";
import { Modal } from "./ui/modal";
import { OptionsBar } from "./ui/optionsBar";
import { StatusBar } from "./ui/statusBar";
import { ParticlesComponent } from "./components/particles";
import { RectangleComponent } from "./components/rectangle";
import { ContextMenu } from "./ui/contextmenu";

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
    this.loadFFmpeg();
  }

  private registerComponents() {
    this.componentRegistry.set("audio-spectrum", AudioSpectrum);
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
    const baseUrl =
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
    this.ffmpeg.on("log", ({ type, message }) => {
      console.log(`[${type}]`, message);
    });

    await this.ffmpeg.load({
      coreURL: `${baseUrl}/ffmpeg-core.js`,
      wasmURL: `${baseUrl}/ffmpeg-core.wasm`,
    });
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
      const c = this.componentRegistry.get(comp.key);
      if (!c) continue;

      const newComp = new c(this, comp.key);

      for (const [key, val] of comp.props) {
        newComp.properties.set(key, val);

        if (newComp instanceof ImageComponent && key == "source") {
          newComp.image.src = val.value as string;
        }
      }

      this.addComponent(newComp);
    }

    return true;
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

      let list: any[] = [];

      for (const c of comps) {
        const props = Array.from(c.properties.entries());

        list.push({
          key: c.key,
          props,
        });
      }

      save.components.push(...list);

      const text = JSON.stringify(save);

      localStorage.setItem(`save_${saveNameInput.value}`, text);

      // saving a local file
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
