/**
 * #como-funciona story timing (change xiax-lp-v3-cards-25d · design D12). Pure, so it is
 * unit-tested; the choreography only measures the cards and applies the result.
 */

/** Cards whose tops differ by less than this (px) sit on the same row. */
const SAME_ROW_TOLERANCE_PX = 1;

/**
 * Start delay for each step card. Cards that share a row play one after the other, so
 * 1 → 2 → 3 reads as one story on wide screens; a card alone on its row (stacked on a
 * phone) starts as soon as it scrolls in.
 * @param tops - each card's top edge (px), in DOM order
 * @param gapS - delay (s) between neighbours on the same row
 * @returns delay (s) per card, in the same order
 */
export function storyDelays(tops: readonly number[], gapS: number): number[] {
  let rowTop = Number.NaN;
  let indexInRow = 0;
  return tops.map((top) => {
    const sameRow = Math.abs(top - rowTop) <= SAME_ROW_TOLERANCE_PX;
    indexInRow = sameRow ? indexInRow + 1 : 0;
    if (!sameRow) rowTop = top;
    return indexInRow * gapS;
  });
}
