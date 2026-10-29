/**
 * The razor's cut as a state of the line it cuts (change xiax-lp-v3-razor-3d · design D4).
 * The razor never keeps its own clock for the cut: it reads how much of the line is drawn.
 */

export type CutState = "waiting" | "cutting" | "exiting" | "done";

/**
 * The cut's next state from the line's draw. `exiting → done` is not here: the exit runs on
 * its own clock and ends it. A line rewound to nothing re-arms the cut from any state: the
 * choreography rewinds it out of sight once the visitor scrolls back above the section.
 * @param state - the current state
 * @param drawn - how much of the line is drawn, 0..1
 * @param inPlace - whether the razor is loaded and backed up to the line's start
 * @returns the state for this frame
 */
export function nextCutState(state: CutState, drawn: number, inPlace: boolean): CutState {
  if (drawn <= 0) return "waiting";
  const started = state === "waiting" ? (inPlace ? "cutting" : "done") : state;
  return started === "cutting" && drawn >= 1 ? "exiting" : started;
}
