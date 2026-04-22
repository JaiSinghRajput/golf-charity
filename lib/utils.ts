export const currency = (amountCents: number) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(amountCents / 100);
};

export const dateLabel = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

export const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
