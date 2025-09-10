import { App } from "./app";
import "./style.css";

const app = new App();

window.onload = () => {
  document.body.append(app.view);
};
