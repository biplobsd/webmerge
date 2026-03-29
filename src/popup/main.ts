import { mount } from "svelte";
import Popup from "./Popup.svelte";
import "src/assets/app.css";

mount(Popup, { target: document.getElementById("app") ?? document.body });
