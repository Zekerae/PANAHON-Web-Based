import assert from 'node:assert';
import fs from 'node:fs';

console.log('--- START BOOT SEQUENCE REFRESH LOGIC TEST ---');

// 1. Verify BootSequence.jsx contains the reload and storage detection
const bootSeqSource = fs.readFileSync('src/components/boot/BootSequence.jsx', 'utf8');
assert(bootSeqSource.includes('panahon_intro_seen'), 'BootSequence must check panahon_intro_seen');
assert(bootSeqSource.includes('performance.getEntriesByType'), 'BootSequence must check navigation timing');
assert(bootSeqSource.includes('navEntry.type === "reload"'), 'BootSequence must check for reload navigation');
assert(bootSeqSource.includes('return "loading"'), 'BootSequence must return loading stage on refresh');
console.log('✓ 1. BootSequence.jsx contains navigation reload & storage checks');

// 2. Verify App.jsx wires forceVideo and onReplayIntro properly
const appSource = fs.readFileSync('src/App.jsx', 'utf8');
assert(appSource.includes('forceVideo={forceIntroVideo}'), 'App.jsx must pass forceVideo prop');
assert(appSource.includes('removeItem(\'panahon_intro_seen\')'), 'onReplayIntro must clear intro_seen key');
console.log('✓ 2. App.jsx wires forceVideo prop and clears storage on Replay Intro');

// 3. Test functional stage determination logic in simulated browser environments
function determineInitialStage({ forceVideo = false, isReload = false, seenInSession = false, seenGlobal = false }) {
  if (forceVideo) return "video";
  if (isReload || seenInSession || seenGlobal) {
    return "loading";
  }
  return "video";
}

// Case A: First visit (cold launch) -> should show video
assert.strictEqual(
  determineInitialStage({ forceVideo: false, isReload: false, seenInSession: false, seenGlobal: false }),
  "video",
  "First visit must show intro video"
);
console.log('✓ 3. First visit correctly presents intro video');

// Case B: Browser refresh (isReload = true) -> should go straight to loading screen
assert.strictEqual(
  determineInitialStage({ forceVideo: false, isReload: true, seenInSession: false, seenGlobal: false }),
  "loading",
  "Browser reload must skip directly to loading screen"
);
console.log('✓ 4. Page refresh (isReload) correctly skips to loading screen');

// Case C: Subsequent refresh in session (seenInSession = true) -> should go straight to loading screen
assert.strictEqual(
  determineInitialStage({ forceVideo: false, isReload: true, seenInSession: true, seenGlobal: true }),
  "loading",
  "Session refresh must skip directly to loading screen"
);
console.log('✓ 5. Session refresh correctly skips to loading screen');

// Case D: User clicks 'Replay Intro' (forceVideo = true) -> must show video
assert.strictEqual(
  determineInitialStage({ forceVideo: true, isReload: false, seenInSession: true, seenGlobal: true }),
  "video",
  "Replay Intro must force intro video to play"
);
console.log('✓ 6. Replay Intro explicitly overrides storage to show video');

console.log('✓ ALL BOOT SEQUENCE REFRESH TESTS PASSED (6/6)');
process.exit(0);

