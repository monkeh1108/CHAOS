import { createGame } from "./engine.js";
import { attachGameBrowser } from "./ui/browser_session.js";
import { mountContactLab } from "./debug/contact_lab.js";

window.GRIDIRON_DEBUG = createGame({ attach: attachGameBrowser });
mountContactLab();
