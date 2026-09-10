export const THEME_STORAGE_KEY = "fitforge-theme";

/**
 * Runs before the browser paints anything, stamping `dark` on `<html>` when it applies.
 *
 * Deliberately a blocking inline script and not a React effect: by the time React
 * hydrates, the first paint has already happened, and a light flash on every load of a
 * dark-themed app is the most visible bug a theme system can have (spec, Edge Cases).
 *
 * The stored choice wins over the OS setting — an explicit preference should not be
 * overruled by a system default. Everything is wrapped because reading localStorage
 * throws outright in some privacy configurations, and a theme is never worth a blank
 * page.
 */
export const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;
