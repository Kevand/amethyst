import type { Component } from "./components/component";

export class Vector2 {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

type Listener<T> = (data: T) => void;

export const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;
export function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}
export function easeInSine(x: number): number {
  return 1 - Math.cos((x * Math.PI) / 2);
}
export function easeOutSine(x: number): number {
  return Math.sin((x * Math.PI) / 2);
}

export type SaveFile = {
  timestamp: string;
  thumbnail: string; // Base64 encoded
  components: SaveComponent[];
};

export type SaveComponent = {
  key: string;
  props: [string, ComponentProperty][];
};

export type ComponentProperty =
  | {
      name: string;
      type: "string";
      value: string;
      onChange?: (val: string) => void;
    }
  | {
      name: string;
      type: "number";
      value: number;
      min: number;
      max: number;
      step: number;
      onChange?: (val: number) => void;
    }
  | {
      name: string;
      type: "boolean";
      value: boolean;
      onChange?: (val: boolean) => void;
    }
  | {
      name: string;
      type: "color";
      value: string;
      onChange?: (val: string) => void;
    }
  | {
      name: string;
      type: "file";
      value: string;
      onChange?: (val: string) => void;
    };

export class EventEmitter {
  private listeners: Map<string, Listener<any>[]>;

  constructor() {
    this.listeners = new Map();
  }

  public clearAll() {
    this.listeners.clear();
  }

  public on<T>(event: string, cb: Listener<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    return this.listeners.get(event)!.push(cb) - 1;
  }

  protected emit(event: string, data: any) {
    if (!this.listeners.has(event)) return;

    for (const cb of this.listeners.get(event)!) {
      cb(data);
    }
  }
}
