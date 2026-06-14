"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/top-nav";
import { Button } from "@/components/ui";

const SEEN_KEY = "mergence_intro_seen";

/**
 * Module-level guard that survives React StrictMode's dev double-mount but
 * resets on a real page load (modules re-evaluate). Without it, the first mount
 * writes SEEN_KEY and StrictMode's second mount would read it back and bail —
 * skipping the splash and clearing the boot→ask timer.
 */
let initializedThisLoad = false;

type Phase = "boot" | "ask";

/**
 * Apple-boot-style intro: full-screen logo + wordmark on first load, then it
 * transitions to a "Are you new to M&A?" question.
 *   • "Yes" → routes to the /learn guided introduction.
 *   • "No"  → fades away to reveal the app.
 * Shows once per browser session (sessionStorage). Under prefers-reduced-motion
 * the boot animation is skipped but the question is still offered (no
 * choreography). Rendered in the root layout so it covers content on first paint.
 */
export function IntroSplash() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("boot");
  const [leaving, setLeaving] = useState(false);
  const [removed, setRemoved] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const seen =
      typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY) === "1";

    // Already shown earlier this session (a prior page load) — get out of the
    // way. `initializedThisLoad` distinguishes that from StrictMode's second
    // mount, where SEEN_KEY was just written by our own first mount.
    if (seen && !initializedThisLoad) {
      setRemoved(true);
      return;
    }

    initializedThisLoad = true;
    sessionStorage.setItem(SEEN_KEY, "1");
    // Lock scroll while the splash is up.
    document.body.style.overflow = "hidden";

    // Always restore scroll on unmount so the lock can never leak (e.g. if the
    // component unmounts before `dismiss` runs).
    const restore = () => {
      document.body.style.overflow = "";
    };

    if (reduce) {
      // Skip the boot choreography, go straight to the choice.
      setPhase("ask");
      return restore;
    }

    // Note: we intentionally do NOT clear this timer on cleanup. Under
    // StrictMode the mount/cleanup/mount cycle would otherwise cancel the only
    // scheduled transition; re-scheduling on the second mount keeps it alive.
    const toAsk = setTimeout(() => setPhase("ask"), 1900);
    return () => {
      clearTimeout(toAsk);
      restore();
    };
  }, []);

  // Clear any pending leave timer if we unmount mid-dismiss.
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  function dismiss(go?: string) {
    setLeaving(true);
    // Unlock scroll immediately — the overlay only fades out from here, and this
    // guarantees the lock is released even if the leave timer never fires.
    document.body.style.overflow = "";
    if (go) router.push(go);
    leaveTimer.current = setTimeout(() => setRemoved(true), 480);
  }

  if (removed) return null;

  const isAsk = phase === "ask";

  return (
    <div
      className={`splash-overlay${leaving ? " is-leaving" : ""}`}
      role={isAsk ? "dialog" : "presentation"}
      aria-modal={isAsk ? true : undefined}
      aria-label={isAsk ? "Welcome to Mergence" : undefined}
      aria-hidden={isAsk ? undefined : true}
    >
      {!isAsk ? (
        <>
          <div className="splash-logo">
            <BrandMark size={60} />
          </div>
          <div className="splash-name text-display-md font-semibold text-ink">Mergence</div>
          <div className="splash-bar">
            <span />
          </div>
        </>
      ) : (
        <div className="splash-ask w-full max-w-[460px] px-lg text-center">
          <div className="flex justify-center">
            <BrandMark size={46} />
          </div>
          <h2 className="mt-lg text-headline text-ink">Are you new to M&amp;A?</h2>
          <p className="mx-auto mt-sm max-w-[400px] text-body text-ink-muted">
            New to mergers &amp; acquisitions? Take a 2-minute primer on the key ideas —
            premiums, synergies, exchange ratios and accretion/dilution — before you dive in.
          </p>
          <div className="mt-xl flex flex-col gap-sm sm:flex-row sm:justify-center">
            <Button variant="primary" onClick={() => dismiss("/learn")} className="px-lg">
              Yes, teach me the basics
            </Button>
            <Button variant="secondary" onClick={() => dismiss("/")} className="px-lg">
              No, take me to the site
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
