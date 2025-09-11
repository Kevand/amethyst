import type { App } from "../app";
import { EventEmitter, type ComponentProperty } from "../helpers";

export class Component extends EventEmitter {
  public properties: Map<string, ComponentProperty>;
  protected app: App;
  public id: number;
  public key: string;

  constructor(app: App, key: string) {
    super();
    this.app = app;
    this.id = app.componentIdCounter++;
    this.properties = new Map();
    this.key = key;

    const self = this;

    this.properties.set("name", {
      name: "Name",
      type: "string",
      value: `${this.constructor.name} ${this.id}`,
      onChange(val) {
        self.emit("namechanged", val);
      },
    });
    this.properties.set("layer", {
      type: "number",
      name: "Layer",
      value: 1,
      min: 0,
      max: 1000,
      step: 1,
      onChange(val) {
        self.emit("layerchanged", val);
      },
    });
    this.properties.set("position-x", {
      name: "Position X",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });
    this.properties.set("position-y", {
      name: "Position Y",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });
    this.properties.set("anchor-x", {
      name: "Anchor X",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });
    this.properties.set("anchor-y", {
      name: "Anchor Y",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });
  }

  public clone(): Component {
    throw new Error("Not Implemented");
  }

  public getProperty<T>(name: string) {
    return this.properties.get(name)?.value as T;
  }

  //@ts-ignore
  update(frame: number) {}

  //@ts-ignore
  draw(ctx: CanvasRenderingContext2D) {}
}
