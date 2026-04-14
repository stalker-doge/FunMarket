const EXP_OVERFLOW_GUARD = 500;

function safeExp(x: number): number {
  return Math.exp(Math.min(x, EXP_OVERFLOW_GUARD));
}

/** Cost function: C(q) = b * ln( sum( e^(q_i / b) ) ) */
export function lmsrCost(sharesOutstanding: number[], b: number): number {
  const maxQ = Math.max(...sharesOutstanding);
  const sumExp = sharesOutstanding.reduce(
    (sum, q) => sum + safeExp((q - maxQ) / b),
    0
  );
  return b * (maxQ / b + Math.log(sumExp));
}

/** Current price of outcome i (0 to 1) */
export function lmsrPrice(
  sharesOutstanding: number[],
  b: number,
  outcomeIndex: number
): number {
  const maxQ = Math.max(...sharesOutstanding);
  const exps = sharesOutstanding.map((q) => safeExp((q - maxQ) / b));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps[outcomeIndex] / sumExps;
}

/** Cost to buy `quantity` shares of outcome at `outcomeIndex` */
export function lmsrBuyCost(
  sharesOutstanding: number[],
  b: number,
  outcomeIndex: number,
  quantity: number
): number {
  const before = lmsrCost(sharesOutstanding, b);
  const afterShares = [...sharesOutstanding];
  afterShares[outcomeIndex] += quantity;
  const after = lmsrCost(afterShares, b);
  return after - before;
}

/** Refund from selling `quantity` shares of outcome at `outcomeIndex` */
export function lmsrSellCost(
  sharesOutstanding: number[],
  b: number,
  outcomeIndex: number,
  quantity: number
): number {
  const before = lmsrCost(sharesOutstanding, b);
  const afterShares = [...sharesOutstanding];
  afterShares[outcomeIndex] -= quantity;
  const after = lmsrCost(afterShares, b);
  // Selling decreases total cost, so refund = before - after
  return before - after;
}

/** Get all outcome prices as percentages (0-1) */
export function lmsrAllPrices(sharesOutstanding: number[], b: number): number[] {
  return sharesOutstanding.map((_, i) => lmsrPrice(sharesOutstanding, b, i));
}
