import { createMatchDebug } from "./match_controls.js";
import { createMatchView } from "./match_view.js";
import { createContactScenarios } from "./contact_scenarios.js";
import { createContactInspection } from "./contact_inspection.js";

export function createGameDebug(services) {
  return {
    ...createMatchDebug(services),
    ...createMatchView(services),
    ...createContactScenarios(services),
    ...createContactInspection(services),
  };
}
