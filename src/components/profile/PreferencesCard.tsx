"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Me } from "@/lib/auth-transport";
import { formatHeight, type UnitPreference } from "@/lib/units";
import { cn } from "@/lib/utils";

/** VI-020: this order is the reference's. */
const GOALS = ["Hypertrophy", "Strength", "Endurance", "GeneralFitness"] as const;

const GOAL_LABELS: Record<string, string> = {
  Hypertrophy: "Hypertrophy",
  Strength: "Strength",
  Endurance: "Endurance",
  GeneralFitness: "General fitness",
};

/**
 * VI-021: the default first, then the natural order.
 *
 * The reference orders the OPTIONS this way. The stored enum keeps its natural order —
 * making Intermediate zero to match a dropdown would be a presentation concern leaking
 * into the schema.
 */
const EXPERIENCE = ["Intermediate", "Beginner", "Advanced"] as const;

const TIME_ZONES = [
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;

/** VI-018 through VI-023, and VI-028. */
export function PreferencesCard({
  member,
  profile,
}: {
  member: Me["member"];
  profile: Me["profile"];
}) {
  const [units, setUnits] = useState<UnitPreference>(member.units as UnitPreference);
  const [goal, setGoal] = useState(member.goal);
  const [experience, setExperience] = useState(member.experience);
  const [timeZone, setTimeZone] = useState(member.timeZone);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: Record<string, string>) {
    setError(null);

    // Only the field that changed. Sending the whole form would make every save a
    // four-field write carrying values the member did not touch, which is how a stale
    // tab silently overwrites a change made in another one.
    const response = await fetch("/api/bff/me/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);

    if (!response?.ok) {
      const body = (await response?.json().catch(() => ({}))) as { title?: string };
      setError(body?.title ?? "That change could not be saved.");
    }
  }

  return (
    // VI-018: rounded, 1px border, card fill, 20px padding, heading 14px semibold.
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Preferences</h2>

      <div className="mt-4">
        <Label htmlFor="units-metric">Units</Label>

        {/* VI-019: WIDTH TO CONTENT, not full width — inline-flex, not grid. The
            reference sizes this control to its two labels; a full-width version reads
            as a different control. 16px horizontal padding, 6px vertical. */}
        <div className="mt-1.5 inline-flex rounded-md bg-muted p-1">
          {(["Metric", "Imperial"] as const).map((value) => (
            <button
              key={value}
              id={`units-${value.toLowerCase()}`}
              type="button"
              aria-pressed={units === value}
              onClick={() => {
                // VI-028: displayed values re-render immediately and NOTHING stored
                // changes. The request carries the preference, never a measurement
                // (FR-011, invariant 4).
                setUnits(value);
                void save({ units: value });
              }}
              className={cn(
                "rounded-sm px-4 py-1.5 text-sm transition-colors",
                units === value
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {value === "Metric" ? "kg / cm" : "lb / in"}
            </button>
          ))}
        </div>

        {/* What proves VI-028 to a member: this re-renders on the click above, and the
            centimetres behind it are untouched. */}
        <p className="mt-2 text-xs text-muted-foreground">
          Height:{" "}
          <span data-testid="height">{formatHeight(profile.heightCm, units)}</span>
        </p>
      </div>

      {/* VI-020 */}
      <div className="mt-4">
        <Label htmlFor="goal">Goal</Label>
        <div className="mt-1.5">
          <Select
            id="goal"
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value);
              void save({ goal: event.target.value });
            }}
          >
            {GOALS.map((value) => (
              <option key={value} value={value}>
                {GOAL_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* VI-021 */}
      <div className="mt-4">
        <Label htmlFor="experience">Experience</Label>
        <div className="mt-1.5">
          <Select
            id="experience"
            value={experience}
            onChange={(event) => {
              setExperience(event.target.value);
              void save({ experience: event.target.value });
            }}
          >
            {EXPERIENCE.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* VI-022: an IANA name with its UTC offset in parentheses. */}
      <div className="mt-4">
        <Label htmlFor="timeZone">Time zone</Label>
        <div className="mt-1.5">
          <Select
            id="timeZone"
            value={timeZone}
            onChange={(event) => {
              setTimeZone(event.target.value);
              void save({ timeZone: event.target.value });
            }}
          >
            {[...new Set([member.timeZone, ...TIME_ZONES])].map((zone) => (
              <option key={zone} value={zone}>
                {zone} ({offsetOf(zone)})
              </option>
            ))}
          </Select>
        </div>

        {/* VI-023, verbatim and MANDATORY (annotation K3). It is the explanation a
            member needs when a streak breaks at an unexpected hour, and the reason
            plan.md D10 refuses to fall back to UTC silently. */}
        <p className="mt-2 text-xs text-muted-foreground">
          Weeks and streaks are counted in this zone.
        </p>
      </div>

      {error !== null && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}
    </Card>
  );
}

/** "UTC+8" for an IANA zone, computed rather than tabulated so it follows DST. */
function offsetOf(zone: string): string {
  try {
    const label = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    // VI-022 writes the offset as "UTC+8". Intl's shortOffset yields "GMT+8" in
    // en-GB — the same instant, a different word, and the reference fixes the word.
    // Found by the Visual Compliance Loop reading the rendered option, which is the
    // only place the difference is visible.
    return label ? label.replace("GMT", "UTC") : "UTC";
  } catch {
    // A zone the browser cannot resolve. The server refuses to STORE one (D10), so
    // this is only reachable for a value already stored, and showing the name without
    // an offset beats showing nothing.
    return "offset unknown";
  }
}
