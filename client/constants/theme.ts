import { Platform } from "react-native";

// Premium Neurochemical Palette for Dopamine Lab
export const PremiumColors = {
  forestGreen: "#2F6F4E",
  copperOrange: "#D97C3F",
  skyBlue: "#7EC6E8",
  sandBeige: "#E6DCC7",
  textPrimary: "#1B1B1B",
  textSecondary: "#7A7A7A",
  borderLight: "#E2E2E2",
  backgroundMain: "#FAF8F4",
  cardBackground: "#FFFFFF99", // slight translucency
};

export const EarthyColors = {
  terraBrown: "#8B5A2B",
  clayRed: "#C67B5C",
  forestGreen: "#4A6741",
  smokeGrey: "#6B6B6B",
  sandBeige: "#D4C4A8",
  copper: "#B87333",
  warmCharcoal: "#2C2620",
  warmOffWhite: "#FAF7F2",
  deepEarth: "#3D2914",
  sage: "#9CAF88",
  rust: "#B7472A",
  gold: "#C9A227",
  // Dopamine Lab specific colors - softer, modern palette
  dopaminePrimary: "#6B9BD1",
  dopamineSuccess: "#7BC67E",
  dopamineGlow: "#A8D5BA",
  dopamineMuted: "#E8F4F8",
  dopamineAccent: "#FF8C69",
};

export const Colors = {
  light: {
    text: "#2C2620",
    textSecondary: "#6B6B6B",
    buttonText: "#FAF7F2",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#8B5A2B",
    link: "#8B5A2B",
    primary: "#8B5A2B",
    secondary: "#4A6741",
    accent: "#C9A227",
    success: "#4A6741",
    error: "#B7472A",
    warning: "#C9A227",
    border: "#E5DFD3",
    backgroundRoot: "#FAF7F2",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F5F0E8",
    backgroundTertiary: "#EDE6DA",
    cardBackground: "#FFFFFF",
    gradientStart: "#FAF7F2",
    gradientEnd: "#EDE6DA",
  },
  dark: {
    text: "#FAF7F2",
    textSecondary: "#A89F94",
    buttonText: "#FAF7F2",
    tabIconDefault: "#6B6B6B",
    tabIconSelected: "#D4C4A8",
    link: "#D4C4A8",
    primary: "#D4C4A8",
    secondary: "#9CAF88",
    accent: "#C9A227",
    success: "#9CAF88",
    error: "#C67B5C",
    warning: "#C9A227",
    border: "#3D3530",
    backgroundRoot: "#1A1714",
    backgroundDefault: "#2C2620",
    backgroundSecondary: "#3D3530",
    backgroundTertiary: "#4A433D",
    cardBackground: "#2C2620",
    gradientStart: "#2C2620",
    gradientEnd: "#1A1714",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  "2xl": 48, // alias for xxl
  inputHeight: 56,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  titleLarge: {
    fontSize: 34,
    fontWeight: "700" as const,
  },
  titleMedium: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  label: {
    fontSize: 12,
    fontWeight: "500" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Gradients = {
  earthyWarm: ["#FAF7F2", "#EDE6DA", "#D4C4A8"],
  earthyDark: ["#2C2620", "#1A1714", "#0D0B09"],
  copper: ["#B87333", "#C9A227"],
  forest: ["#4A6741", "#9CAF88"],
  clay: ["#C67B5C", "#8B5A2B"],
};
