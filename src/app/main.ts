import App from "./App.svelte";
import { logger } from "src/lib/logger";
import { mount } from "svelte";
import "src/assets/app.css";

const target = document.getElementById("app");

function render() {
  if (target) {
    mount(App, { target });
  } else {
    logger.error("Unable to find app element");
  }
}

document.addEventListener("DOMContentLoaded", render);
