import "./style.css";
import { createMenuBarUI } from "./ui/menu_bar";

const app = document.querySelector("#app") as HTMLDivElement;

window.onload = () => {
  app.append(createMenuBarUI());
};
