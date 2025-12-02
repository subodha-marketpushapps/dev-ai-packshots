export const formatCurrency = (
  value: number = 0,
  currency: string | undefined = undefined,
  locale: string = "en-US"
) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: currency ? "currency" : "decimal",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
};

export const formatNumber = (value: number = 0) => {
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
};
