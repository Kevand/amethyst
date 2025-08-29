import logo from "/logo.svg";

export function createMenuBarUI() {
  const e = document.createElement("div");
  e.classList.add("menu-bar");

  const logoImage = document.createElement("img");
  logoImage.src = logo;

  e.append(logoImage);

  return e;
}
