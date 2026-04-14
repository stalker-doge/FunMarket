const DAILY_ALLOWANCE = 1000;

export function canClaimAllowance(lastAllowance: string | null): boolean {
  if (!lastAllowance) return true;
  const last = new Date(lastAllowance + "Z");
  const now = new Date();
  return last.toDateString() !== now.toDateString();
}

export function getDailyAllowanceAmount(): number {
  return DAILY_ALLOWANCE;
}
