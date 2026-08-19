# Pen Fight 🖊️

The classic "last bench" desk game, as a mobile app. Two players flick their
pens across a table and try to knock the opponent's pen off the edge.

> **Milestone 1** (this codebase): a polished single-device **Pass & Play**
> game — physics, skins, sound, theming, i18n. Later phases (Firebase auth,
> Razorpay donations + weekly transparency, streaks, push notifications,
> WiFi multiplayer) slot into `src/features/` without reworking the engine.

## Tech stack

- **React Native 0.86** (CLI, New Architecture) — JavaScript
- **@shopify/react-native-skia** — GPU canvas rendering
- **react-native-reanimated 4** + **react-native-worklets** — physics runs in a
  worklet on the UI thread (off the JS thread) for 60fps on low-end devices
- **react-native-gesture-handler** — the flick gesture
- **@react-navigation/native-stack** — navigation
- **zustand** — discrete game state · **react-native-mmkv** (v4 / Nitro) — persistence
- **i18next / react-i18next** — i18n with RTL scaffold (en + ar)
- **react-native-sound** — SFX + music (defensive: silent until assets are added)

## Getting started

```bash
npm install
# iOS pods (note the UTF-8 locale, required by CocoaPods on this machine)
cd ios && LANG=en_US.UTF-8 pod install && cd ..

# run
npm start            # Metro
npm run ios          # or: npm run android
```

## Architecture

```
src/
  app/            App root, navigation, providers (Theme, i18n)
  screens/        Home, Game, Settings, SkinSelect
  game/
    engine/       vec2, physics, collision, boundary, constants  (all worklets)
    state/        useGameStore (zustand), gameMachine (turn FSM)
    input/        useFlickGesture  (pan -> aim/power, slingshot)
    render/       GameCanvas (Skia + frame loop), Table, Pen, AimIndicator
    config/       tableLayout  (playable rect + px-space tuning)
  skins/          registry.js  (data-driven: visuals + physics per skin)
  audio/          SoundManager, sounds
  ui/             Button, Text, Modal + theme tokens
  i18n/           locales/en.json, ar.json
  lib/            storage (mmkv), responsive (tablet scaling)
  features/       LATER phases (auth, donations, streaks, notifications, multiplayer)
```

**How a shot works:** a live shot lives entirely in a Reanimated shared `world`
(both pens' `{x,y,vx,vy,angle,omega}`). `GameCanvas` runs a fixed-timestep loop
in `useFrameCallback` (UI thread): integrate → collide (circle-circle impulse) →
boundary (off-table = lose). It crosses back to JS only at discrete events
(hit / settle / game-over) via `runOnJS`, updating the zustand store which drives
the HUD and win modal. Fixed timestep keeps the feel identical at 60/120fps and
makes future multiplayer a replay-of-inputs problem.

**Tuning the feel:** all physics coefficients are in
`src/game/engine/constants.js` (expressed relative to table height, so the feel
is identical on phone and tablet). `tableLayout.js` converts them to px.

**Adding a pen skin:** add one object to `src/skins/registry.js` — no other
changes. Each skin carries both its look and its physics (`mass`, `radius`).

## Known follow-ups (Milestone 1 polish)

- **Sound assets**: drop real audio files per `src/audio/sounds.js`
  (Android → `android/app/src/main/res/raw/`, iOS → Xcode bundle resources).
  The game runs silently until then.
- **Landscape lock**: the Game screen requests `orientation: 'landscape'` via
  native-stack, but the simulator did not rotate in testing. Confirm on device;
  if needed, set supported orientations in `Info.plist` / `AndroidManifest.xml`
  or add `react-native-orientation-locker`.
- **Collider fidelity**: pens use a single circle collider (a deliberate M1
  simplification). Upgrade to a capsule/2-circle collider if playtesting wants it.
- **Android**: only iOS was build-verified in this session; run
  `npm run android` and confirm.
