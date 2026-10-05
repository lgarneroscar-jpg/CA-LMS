export const BRAND = {
  name: "Corporate Academy",
  tagline: "Built for Career Success",
  productName: "Learning Center",
  primary: "#1B2A4A",
  accent: "#C9A84C",
} as const;

export const SUPPORT_EMAIL = "academy@corpacad.com";

export const LOGIN_HELP_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "Corporate Academy — login help"
)}`;
