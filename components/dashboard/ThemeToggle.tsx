"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "synapse-theme";

function applyTheme(theme: "dark" | "light") {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage can throw in private/incognito contexts with storage
    // disabled — theme just won't persist across reloads, which is fine.
  }
}

export default function ThemeToggle() {
  // Starts null so the button doesn't render a possibly-wrong icon before
  // mount (the real theme was already set pre-paint by the inline script
  // in app/layout.tsx — this just mirrors it into React state).
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    const current = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(current);
  }, []);

  if (!theme) {
    return <div className="w-full h-9" aria-hidden="true" />;
  }

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      className="nav-item flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <span className="material-symbols-outlined">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
      <span>{theme === "dark" ? "Bright mode" : "Dark mode"}</span>
    </button>
  );
}
