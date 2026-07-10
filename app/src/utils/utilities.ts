export const calculatePrice = (
  weight: number,
  goldPrice: number,
  wage: number,
  profit: number,
  taxPercent = 0
) => {
  const base = weight * goldPrice + wage + profit;
  const tax = (base * taxPercent) / 100;
  return Math.round(base + tax);
};
