export const KHR_PER_USD = 4100;

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatKHR(amount: number): string {
  const khr = Math.round(amount * KHR_PER_USD);
  return `${khr.toLocaleString("en-US")} KHR`;
}

export function formatDualPrice(amount: number): { usd: string; khr: string } {
  return {
    usd: formatUSD(amount),
    khr: formatKHR(amount),
  };
}
