import type { App } from "../app";
import { Component } from "./component";

export class ParticlesComponent extends Component {
  constructor(app: App, key: string) {
    super(app, key);

    this.properties.set("width", {
      name: "Width",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });

    this.properties.set("height", {
      name: "Height",
      type: "number",
      value: 0,
      min: -999999,
      max: 999999,
      step: 1,
    });

    this.properties.set("color", {
      name: "color",
      value: "#ffffff",
      type: "color",
    });

    this.properties.set("base-velocity", {
      name: "Base Velocity",
      type: "number",
      min: 0,
      max: 100,
      step: 0.1,
      value: 1,
    });

    this.properties.set("count", {
      name: "Particle Count",
      type: "number",
      min: 1,
      max: 10000,
      step: 1,
      value: 100,
    });

    this.properties.set("life", {
      name: "Life",
      type: "number",
      min: 1,
      max: 10000,
      step: 1,
      value: 60,
    });

    this.properties.set("angle", {
      name: "Angle",
      type: "number",
      min: 0,
      max: 360,
      step: 1,
      value: 0,
    });

    this.properties.set("spread", {
      name: "Spread",
      type: "number",
      min: 0,
      max: 360,
      step: 1,
      value: 20,
    });

    this.properties.set("size", {
      name: "Size",
      type: "number",
      min: 1,
      max: 999,
      step: 1,
      value: 2,
    });

    this.properties.set("size-spread", {
      name: "Size Spread",
      type: "number",
      min: 1,
      max: 999,
      step: 1,
      value: 1,
    });

    this.properties.set("bass-multiplier", {
      name: "Bass Velocity Multiplier",
      type: "number",
      min: 0,
      max: 100,
      step: 0.1,
      value: 1,
    });
  }

  private particles: Particle[] = [];

  public clone() {
    const c = new ParticlesComponent(this.app, this.key);
    c.properties = Object.assign({}, this.properties);
    return c;
  }

  update(_: number): void {
    const count = this.getProperty<number>("count");

    const posX = this.getProperty<number>("position-x");
    const posY = this.getProperty<number>("position-y");
    const width = this.getProperty<number>("width");
    const height = this.getProperty<number>("height");

    const velocity = this.getProperty<number>("base-velocity");
    const color = this.getProperty<string>("color");
    const bassMultiplier = this.getProperty<number>("bass-multiplier");
    const angle = this.getProperty<number>("angle");
    const life = this.getProperty<number>("life");
    const spread = this.getProperty<number>("spread");
    const size = this.getProperty<number>("size");
    const sizeSpread = this.getProperty<number>("size-spread");

    let ps = (spread / 2) * (1 - Math.random() * 2);
    let pl = (60 / 2) * (1 - Math.random() * 2);
    let pv = (1 / 2) * (1 - Math.random() * 2);
    let pSize = (sizeSpread / 2) * 1 - Math.random() * 2;

    const randomX = posX + Math.floor(Math.random() * (width - posX));
    const randomY = posY + Math.floor(Math.random() * (height - posY));

    if (this.particles.length < count)
      this.particles.push(
        new Particle({
          x: randomX,
          y: randomY,
          velocity: velocity + pv,
          angle: angle + ps,
          color,
          life: life + pl,
          size: size + pSize,
        })
      );

    const bassValue = (bassMultiplier / 100) * this.app.engine.bass;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.update(bassValue);

      if (p.dead) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(): void {
    for (const p of this.particles) {
      p.draw(this._ctx);
    }
  }
}

type IParticle = {
  x: number;
  y: number;
  velocity: number;
  angle: number;
  color: string;
  life: number;
  size: number;
};

class Particle {
  x: number;
  y: number;
  velocity: number;
  angle: number;
  color: string;
  life: number;
  baseLife: number;
  dead: boolean;
  size: number;

  constructor(p: IParticle) {
    this.x = p.x;
    this.y = p.y;
    this.velocity = p.velocity;
    this.angle = p.angle;
    this.color = p.color;
    this.life = p.life;
    this.baseLife = p.life;
    this.dead = false;
    this.size = p.size;
  }

  update(bassValue: number) {
    // update position
    const rad = this.angle * (Math.PI / 180);

    const vx = Math.cos(rad) * (this.velocity + bassValue);
    const vy = Math.sin(rad) * (this.velocity + bassValue);

    this.x += vx;
    this.y += vy;

    this.life--;

    if (this.life <= 0) {
      this.dead = true;
    }
  }

  draw(ctx: OffscreenCanvasRenderingContext2D) {
    ctx.save();

    ctx.globalAlpha = this.life / this.baseLife;
    ctx.fillStyle = this.color;

    ctx.beginPath();

    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);

    ctx.fill();

    ctx.restore();
  }
}
