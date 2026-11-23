import { createReceiverFlight } from "../ai/receiver_flight.js";
import { createTackleContacts } from "../physics/tackle_contacts.js";
import { createMatchPossession } from "./match_possession.js";
import { createPlayCalling } from "./play_calling.js";
import { createMatchStart } from "./match_start.js";
import { createGameClock } from "./game_clock.js";
import { createPlayLifecycle } from "./play_lifecycle.js";
import { createPlaySetup } from "./play_setup.js";
import { createSpecialTeamsSetup } from "./special_teams_setup.js";
import { createKickReturn } from "./kick_return.js";
import { createSpecialTeamsStep } from "./special_teams_step.js";
import { createPlayerSetup } from "./player_setup.js";
import { createControlActions } from "./control_actions.js";
import { createBallCarrier } from "./ball_carrier.js";
import { createPassControl } from "./pass_control.js";
import { createAirActions } from "./air_actions.js";
import { createAirOutcomes } from "./air_outcomes.js";
import { createMatchTick } from "./match_tick.js";
import { createPlaySelection } from "../ai/play_selection.js";
import { createCoverageSetup } from "../ai/coverage_setup.js";
import { createReceivingRoutes } from "../ai/receiving_routes.js";
import { createDefensiveReaction } from "../ai/defensive_reaction.js";
import { createPursuit } from "../ai/pursuit.js";
import { createRunSupport } from "../ai/run_support.js";
import { createPassProtection } from "../ai/pass_protection.js";
import { createInsideZoneBlocking } from "../ai/inside_zone_blocking.js";
import { createBallCarrierAI } from "../ai/ball_carrier.js";
import { createQuarterback } from "../ai/quarterback.js";
import { createPlayerMovement } from "../physics/player_movement.js";
import { createGroundMotion } from "../physics/ground_motion.js";
import { createBlockEngagement } from "../physics/block_engagement.js";
import { createBodyCollision } from "../physics/body_collision.js";
import { createMotionStep } from "../physics/motion_step.js";
import { createTackleLinks } from "../physics/tackle_links.js";
import { createTackleResolution } from "../physics/tackle_resolution.js";

// Every system is allocated before linking the rule and physics calls shared between them.
export function createMatchSystems(ports) {
  const subsystems = [
    createMatchPossession(),
    createPlayCalling(),
    createMatchStart(),
    createGameClock(),
    createPlayLifecycle(),
    createPlaySetup(),
    createSpecialTeamsSetup(),
    createKickReturn(),
    createSpecialTeamsStep(),
    createPlayerSetup(),
    createControlActions(),
    createBallCarrier(),
    createPassControl(),
    createAirActions(),
    createAirOutcomes(),
    createMatchTick(),
    createPlaySelection(),
    createCoverageSetup(),
    createReceivingRoutes(),
    createReceiverFlight(),
    createDefensiveReaction(),
    createPursuit(),
    createRunSupport(),
    createPassProtection(),
    createInsideZoneBlocking(),
    createBallCarrierAI(),
    createQuarterback(),
    createPlayerMovement(),
    createGroundMotion(),
    createBlockEngagement(),
    createBodyCollision(),
    createMotionStep(),
    createTackleLinks(),
    createTackleContacts(),
    createTackleResolution(),
  ];
  const services = { ...ports };
  for (const { bind, ...provided } of subsystems) {
    Object.assign(services, provided);
  }
  for (const { bind } of subsystems) bind?.(services);
  return services;
}
