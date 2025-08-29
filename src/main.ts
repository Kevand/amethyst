import "./style.css";

const app = document.querySelector("#app") as HTMLDivElement;

const canvas = document.createElement("canvas");
canvas.width = 1920;
canvas.height = 1080;

window.onload = () => {
  app.append(canvas);
};
