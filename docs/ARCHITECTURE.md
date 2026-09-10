# Architecture

## Stack

React 19 and TypeScript, built with Vinext/Vite using the scaffold's App Router structure. The final output is static (`output: 'export'` in `next.config.ts`). UI primitives use the included Base UI/Shadcn components; diagram icons use Lucide. The runtime simulation has no server dependency.

## State and playback

`lib/simulation.ts` exports a pure `makeSteps(protocol)` function. Each of the 36 steps completely describes a teaching state: device, OSI layer, direction, data unit, encryption status, router traversal, active link, diagram position, and explanatory text.

`inspectPacket(step, protocol, path)` derives the currently visible wrappers and field values. IPv4 and TCP endpoints depend on direction; Ethernet addresses depend on both direction and link. TTL is 64 before routing and 63 after routing. Responses start a new packet with TTL 64.

The page owns a single step index and playback timer. Next, previous, scrubbing, and phase shortcuts set that index, so every visible panel reconstructs the same deterministic state. Manual navigation pauses playback. No reverse animation history or mutable packet objects are needed. The timer advances once per 2.6 seconds at 1× speed, independent of CSS marker movement.

The draft path and submitted path are separate: typing does not change an in-flight example. Submission validates the path, starts again at step one, and begins playback. Protocol changes pause and reset the journey. The display distinguishes HTTP plaintext at endpoints from the symbolic encrypted TLS content on the wire.

## Files to change

- `lib/simulation.ts`: protocol steps, address model, layer explanations, and quizzes.
- `app/page.tsx`: interactions and view composition (network canvas, stack, event card, packet inspector, playback, dialogs).
- `app/globals.css`: shared theme, responsive layout, motion, and component overrides.
- `tests/simulation.test.mjs`: protocol invariants and request validation tests using Node's built-in runner.
- `scripts/serve.mjs`: simple local production server for the static `dist/client/` directory.

## Optional browser agent interface

When `document.modelContext.registerTool` is available, the page registers `read_simulation` and `configure_simulation`. Configuration validates the protocol, request path, and 1-based step before updating the same React state as the visible controls. Registration is feature-detected, cleaned up with an AbortSignal, and has no effect in browsers without the API. The encrypted payload is not returned by the read tool.

This optional WebMCP surface was not validated in a supported browser context during V1 creation. Normal UI use does not require it.

## Locality and future Git use

The project contains all authored content and assets, and keeps dependency caches under `.cache/`. No external APIs, runtime web fonts, credentials, user data storage, or machine-specific source paths are required. `.openai/hosting.json` records static output only; it contains no site identifier. No Git commands are run as part of setup, development, building, or serving.
