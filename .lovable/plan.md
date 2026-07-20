# Route-Based Parent/Student Architecture

## New Routing Structure

```
/             → ModeLanding (new) — two large cards: Student / Parent
/student      → Original Talk2Campus homepage (current Index.tsx content, untouched)
/parent       → ParentHome (voice-first, isolated)
/chat, /attendance, /canteen, /canteen/vendor, /updates, /timetable → unchanged
```

`localStorage.t2c_app_mode` persists last choice. On first load at `/`, if a stored mode exists, auto-redirect to `/student` or `/parent`. Visiting `/` explicitly (e.g. via logo) always shows the landing chooser — handled with a `?choose=1` query or a small "Change mode" link from inside each route that routes to `/?choose=1`.

## Files

**New**
- `src/pages/ModeLanding.tsx` — premium two-card chooser, sets mode in localStorage, navigates to `/student` or `/parent`.
- `src/pages/StudentHome.tsx` — exact current student JSX moved out of `Index.tsx` (Navbar + HeroSection + FeaturesSection + Footer + SEOHead). No logic changes.

**Modified**
- `src/App.tsx` — add routes `/student` → `StudentHome`, `/parent` → `ParentHome`; `/` → `ModeLanding`.
- `src/pages/Index.tsx` — becomes a thin redirector: reads `useAppMode`, if stored mode exists and no `?choose=1`, `<Navigate to="/student|/parent" replace />`; otherwise render `ModeLanding`. (Or simply make `/` always render `ModeLanding` and have it auto-redirect on mount when a stored mode exists.)
- `src/components/ModeToggle.tsx` — replace internal `onChange` state calls with `navigate('/student' | '/parent')` and also persist mode. Keep same pill UI.
- `src/pages/ParentHome.tsx` — remove the centered top `ModeToggle` (it overlapped). Replace with a small "Student Mode" pill button top-left that calls `navigate('/student')`. Strengthen unmount cleanup: explicit `session.stop()` + `stopSpeaking()` + `window.speechSynthesis.cancel()` + abort any in-flight recognition.
- `src/pages/StudentHome.tsx` — add a tiny "Parent Mode" pill in a non-overlapping spot (top-right under Navbar on desktop, or bottom-right floating on mobile) that calls `navigate('/parent')`. Does NOT touch Navbar, Hero, Features, Footer internals.

**Untouched**
- `Navbar.tsx`, `HeroSection.tsx`, `FeaturesSection.tsx`, `Footer.tsx`
- All canteen / attendance / timetable / updates / chat pages and hooks
- `useParentVoiceSession.ts` (already self-cleans; we just call `.stop()` on route unmount)
- `supabase/functions/campus-ai/index.ts` (parent mode prompt already added)

## Navigation Flow

1. First visit `/` → `ModeLanding` → user picks card → `setMode()` + `navigate('/student' or '/parent')`.
2. Return visit `/` → `Index.tsx` sees stored mode → `<Navigate replace>` to that route.
3. In `/student`, small "Parent" pill → `navigate('/parent')` (and `setMode('parent')`).
4. In `/parent`, small "Student" pill → unmount triggers cleanup → `navigate('/student')`.
5. "Change mode" link (optional, in toggle long-press or via `/?choose=1`) → forces landing page.

## Voice Lifecycle Cleanup

`ParentHome` unmount effect will:
```ts
return () => {
  session.stop();                          // sets activeRef=false, stops recognition, stopSpeaking()
  try { window.speechSynthesis.cancel(); } catch {}
};
```
Because `/parent` unmounts entirely when navigating to `/student`, the voice hook is destroyed — no leakage possible. `useParentVoiceSession` already has a final unmount guard.

## Performance

Route-level code-splitting via `React.lazy` for `ParentHome` and `StudentHome` so student bundle never pulls parent voice code and vice versa. `Suspense` fallback = blank `min-h-screen`.

## What stays identical

- Student homepage rendering, components, styles, behaviors.
- Parent voice session logic, greetings, navigation tag parsing.
- Auth, RBAC, canteen, attendance, all existing routes.

Approve and I'll implement exactly this — no other changes.