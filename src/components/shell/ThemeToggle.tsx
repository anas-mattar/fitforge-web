"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "./theme-script";

/**
 * The `dark` class on `<html>` is the source of truth for which theme is showing — the
 * pre-paint script sets it, and this component only reads and flips it. Subscribing to
 * it rather than mirroring it into React state keeps one authority: two copies of the
 * same preference is how they come to disagree.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const isDarkNow = () => document.documentElement.classList.contains("dark");

// The server cannot know the viewer's preference, so it renders the light-theme label.
// The script has already applied the real theme by the time anyone sees the page;
// suppressHydrationWarning on <html> covers the class the server did not write.
const isDarkOnServer = () => false;

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, isDarkNow, isDarkOnServer);

  function toggle() {
    const next = !isDarkNow();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private browsing and blocked site data both throw here. The theme still
      // applies to this page; it simply will not be remembered.
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="text-muted-foreground"
    >
      {isDark ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
    </Button>
  );
}
