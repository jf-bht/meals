// Farbsystem abgeleitet aus den Design-Referenzen (design-reference/*.png).
// Grün (#22C55E) als vorgegebene Akzentfarbe; dunklere Schattierung für
// primäre CTAs, helle Tint-Fläche für ausgewählte Karten/Badges — so wie
// in den Screenshots (Onboarding-Auswahlkarten, "Kochtag"-Badge, CTA-Button).
export const colors = {
  accent: "#22C55E",
  accentDark: "#15803D",
  accentTint: "#DCFCE7",
  danger: "#DC2626",
  dangerTint: "#FEE2E2",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  surface: "#FFFFFF",
  screenBackground: "#F9FAFB",
  chipNeutral: "#F3F4F6",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  headline: { fontSize: 28, fontWeight: "700" as const, color: colors.textPrimary },
  title: { fontSize: 18, fontWeight: "700" as const, color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary },
  caption: { fontSize: 13, color: colors.textSecondary },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.accentDark,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
  },
};
