export const theme = {
  colors: {
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    secondary: "#6b7280",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    background: "#ffffff",
    backgroundSecondary: "#f9fafb",
    text: "#1f2937",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    borderFocus: "#3b82f6",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    full: "50%",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    xxl: "1.5rem",
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  },
  transitions: {
    fast: "0.15s ease",
    medium: "0.2s ease",
    slow: "0.3s ease",
  },
};

export type Theme = typeof theme;
