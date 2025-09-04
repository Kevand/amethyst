import { StatusBar } from "./ui/statusBar";

export class App {
  public statusBar: StatusBar;

  constructor() {
    this.statusBar = new StatusBar();
  }
}
