# Handdrawn Social Redesign Design

**Date:** 2026-04-09

**Status:** Approved for planning

## Goal

Replace the current iOS-minimal visual language with a warm hand-drawn cream-paper style across the main user-facing flow, while preserving the existing app structure, routes, and core interactions. The homepage should be restructured to feel much closer to the provided "Today's Vibe" reference, but it must continue using the project's existing real avatar photos instead of illustrated portraits.

## Product Intent

The redesign should make the app feel softer, more personal, and more playful. Instead of polished glass and neutral system UI, the interface should feel like a scrapbook dating-social experience made from paper cards, sticker labels, hand-inked outlines, and lightly imperfect shapes. The UI should still be usable and mobile-first, but its strongest impression should be emotional warmth rather than platform neutrality.

## Scope

In scope:

- Re-theme the global app shell, page surfaces, buttons, cards, chips, modal sheets, and tab bar.
- Rebuild the main homepage layout so its information hierarchy resembles the provided reference.
- Apply the same design language to the map page, social chat/report surfaces, and profile pages.
- Preserve current route structure and feature entry points unless a small routing adjustment is required to make the homepage the primary discover surface.
- Keep existing avatar image assets and existing data/content sources.

Out of scope:

- Replacing map functionality or POI business logic.
- Rewriting onboarding flows beyond visual consistency touch-ups.
- Introducing new backend data requirements.
- Changing the three-tab information architecture into the four-tab structure shown in the mockup.

## Visual Direction

### Tone

The visual direction is "soft hand-drawn scrapbook." The UI should feel:

- Cream paper base instead of cool white panels.
- Dark graphite linework instead of thin neutral dividers.
- Low-saturation pastel accents such as blush pink, mint, powder blue, butter yellow, and warm taupe.
- Slightly imperfect geometry using irregular radii, stacked card offsets, sticker-like tags, and wobble-inspired borders.
- Friendly handwritten headings paired with a readable body font.

### Core Design Rules

- Avoid iOS glassmorphism and avoid sterile white cards.
- Avoid neon colors, hard gradients, and glossy effects.
- Prefer layered paper depth, offset shadows, and sketched borders.
- Keep enough contrast and spacing for readability on mobile.
- Use decorative shapes sparingly so interaction targets remain obvious.

## Architecture Fit With Existing App

The current app already separates reusable shell styling from route-specific content. The redesign should keep that structure and introduce a shared hand-drawn design system through the global stylesheet plus a small set of reusable utility classes.

The design should map onto the current codebase like this:

- `src/assets/styles/main.css`: becomes the source of truth for cream-paper tokens, sketch borders, hand-drawn buttons, stacked-card helpers, and page-shell utilities.
- `src/components/ui/TabBar.vue`: gets a full visual rewrite into the shared hand-drawn bottom navigation while keeping the existing three-tab routing logic.
- `src/views/explore/ExploreMap.vue`: becomes the redesigned homepage/discover surface with the new hero card layout.
- `src/views/social/*.vue`: retains existing chat/report interactions but changes panel, bubble, and action styling to match the new language.
- `src/views/profile/*.vue`: adopts a scrapbook dossier presentation for profile/status/history.

No broad file reorganization is needed. The existing codebase is small enough that a styling-led refactor is appropriate.

## Homepage Design

### Role

The homepage should become the clearest expression of the new brand direction. It should visually echo the reference while still supporting the current app's discover and social actions.

### Layout

The homepage should be reorganized into five vertical regions:

1. A handwritten title area near the top, with small decorative doodle/sticker elements.
2. A centered stacked-paper hero card.
3. The main photo window inside that hero card using an existing real avatar image.
4. A compact identity block below the image with name, age, and a paper-tag mood label.
5. A large dual-action area near the lower half for reject/connect actions above the persistent tab bar.

### Hero Card

The hero card should imitate a layered polaroid/paper-stack object:

- Two offset backing sheets behind the main card.
- A main cream card with a dark sketch border and slightly irregular corners.
- A square or slightly portrait image window filled by the current profile photo.
- A handwritten-style name and age line.
- A single mood/status chip rendered like a paper label or speech note.

The card should feel touchable and centered. It may gently float or lift on hover/tap, but motion should remain subtle.

### Actions

The primary actions under the card should mirror the emotional clarity of the reference:

- Left action: pass/dismiss, gray paper circle, sketched X icon.
- Right action: connect/open social, mint paper circle, sketched heart icon.

The current social entry behavior should remain accessible through the positive action. If the existing discover screen also needs search/filter/map controls, those should move into secondary controls rather than competing with the hero card.

### Relationship To Map

The existing map should not disappear from the product. Instead, the discover homepage should prioritize the hero-card experience, while map exploration is surfaced as a secondary entry, toggle, or lower content region consistent with the new style. This preserves existing functionality without forcing a map-first layout.

## Tab Bar Design

The bottom navigation should keep the existing three tabs and routing behavior. It should be redrawn as a cream paper navigation strip with:

- A hand-drawn top divider line.
- Sketch-style icons or icon framing.
- Active state indicated by stronger ink, subtle paper tint, or a small underline/accent marker.
- Labels that feel integrated with the new visual language.

The tab bar should remain fixed and mobile-safe-area aware.

## Profile Design

The profile/status page should shift from the current radial observatory composition to a scrapbook dossier composition. The content can stay mostly the same, but it should be reorganized into stacked paper modules:

- Top area with avatar card, nickname, and type badge.
- Mood traits shown as sketched meters or labeled strips.
- Bio, encounter history, and collection sections shown as pinned notes or clipped cards.
- Detail drawers/sheets should feel like paper panels sliding up from the bottom.

This change should simplify the current visual complexity while making the page more aligned with the homepage.

## Social Chat And Report Design

The chat overlay and report pages should keep their current data flow and interaction timing, but the surfaces should become softer and more handmade:

- Chat bubbles should feel like paper notes instead of system bubbles.
- The overlay should use cream and pencil-gray layers instead of white/glass.
- Avatars and headers should be framed with sketch circles or clipped tags.
- Progress indicators and CTA buttons should use the new shared button system.

The user should still immediately understand speaker order, progress, and the route to the report page.

## Reusable Design System

The redesign should introduce reusable primitives rather than one-off page-specific styling.

Required shared primitives:

- Global paper background and accent color tokens.
- Handwritten heading font token and readable body font token.
- Sketch border utility for cards and chips.
- Stacked-paper card pattern.
- Circular sketch action button pattern.
- Paper label/tag pattern.
- Bottom sheet/panel pattern.
- Shared spacing and shadow tokens tuned for the new style.

These primitives should live mostly in `src/assets/styles/main.css`, with component classes kept readable and not overloaded with repeated inline styles.

## Typography

Typography should differentiate expression and readability:

- Headings and hero labels: a handwritten or brush-like font with personality.
- Body copy and small labels: a clean rounded sans serif suited for Chinese and English content.

If external fonts are used, they should degrade safely and not block usability. If loading a handwriting font cleanly is too costly, the implementation may use a carefully chosen fallback strategy, but the heading treatment still needs to feel distinct from the current system font presentation.

## Motion

Motion should support the paper-object metaphor:

- Gentle float or settling animation on the homepage hero card.
- Soft press feedback for circular action buttons.
- Light slide/fade for panels and overlays.
- No high-speed or glossy transitions.

Reduced-motion handling must remain respected.

## Accessibility And Responsiveness

- Text contrast must remain legible against cream and pastel surfaces.
- Tap targets must stay comfortable on mobile.
- Bottom safe area must be preserved for fixed navigation and bottom sheets.
- The UI should still work at narrow mobile widths without clipped card content.
- Decorative handwriting must not be the only way important information is communicated.

## Implementation Notes

- Prefer restyling existing components before creating many new ones.
- Keep route names and navigation destinations stable.
- Keep real avatar photos in the homepage hero card.
- Preserve current POI, matching, and profile data structures.
- If a map toggle or secondary discover control is added, it should reuse existing route behavior rather than inventing parallel state.

## Testing Expectations

The implementation should be verified with at least:

- Type check and production build success.
- Manual route checks for discover/home, social, profile, and report pages.
- Mobile viewport sanity checks for hero card spacing, bottom navigation overlap, and bottom sheet behavior.
- Regression check that the positive homepage CTA still reaches the existing social flow.

## Self-Review

- Scope is focused on one subsystem: the main app visual redesign, not a product rewrite.
- The homepage, tab bar, profile, and social surfaces all map to concrete existing files.
- No placeholder requirements remain; routes stay stable, real avatars stay in place, and the three-tab structure is explicitly preserved.
