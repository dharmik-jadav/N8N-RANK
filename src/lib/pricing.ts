/** There is no separate listing fee: the only charge is the price of the leaderboard position picked, worked out on the
 *  server. The browser never sends a price. */

/** Smallest bid once something is listed ($5). */
export const MIN_BID_CENTS = 500;
/** While no workflow is listed yet, the very first position costs less ($2). The bids table must allow it (see 20261026_first_listing.sql). */
export const FIRST_LISTING_CENTS = 200;
/** To take a spot you pay that spot's current price plus a step: $2 for #1, $1 for every other spot. */
export const TOP_STEP_CENTS = 200;
export const STEP_CENTS = 100;

/** Price (in cents) to take spot `rank`, given the bid of the workflow that holds it now. */
export const spotPriceCents = (rank: number, currentBidCents: number) =>
  Math.max(MIN_BID_CENTS, currentBidCents + (rank === 1 ? TOP_STEP_CENTS : STEP_CENTS));

export const usd = (cents: number) => (cents / 100).toFixed(2);

/** Only the top 10 paid spots are for sale one by one; anything below them is bought as the first open spot. */
export const MAX_CLAIM_RANK = 10;

/** The spot a card's Claim button buys, and its price: the card's own spot if it holds a paid spot the server sells, otherwise the first open spot. */
export function claimSpot(bidCents: number, rank: number, openRank: number) {
  return bidCents > 0 && rank <= MAX_CLAIM_RANK
    ? { rank, cents: spotPriceCents(rank, bidCents) }
    : { rank: openRank, cents: MIN_BID_CENTS };
}

/** The first open spot: just below every paid listing. `bidsInDollars` is every listing's current bid. */
export const openRankOf = (bidsInDollars: number[]) => bidsInDollars.filter((b) => b > 0).length + 1;
