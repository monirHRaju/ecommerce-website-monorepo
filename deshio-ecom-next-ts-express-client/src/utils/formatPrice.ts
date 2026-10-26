export const formatPrice = (price: number): string => {
  const num = Number(price) || 0;
  return `৳${num.toLocaleString("en-US", {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

export const discountedPrice = (price: number, discount: number): number => {
  return price - (price * (discount || 0)) / 100;
};
