# V1 review checklist

Use this checklist for hands-on review. These are suggested checks, not a claim that automated browser tests ran.

- Switch between HTTP and HTTPS. Confirm ports 80 and 443 and that protocol changes pause/reset playback.
- Enter a request path and send. Check the initial HTTP payload includes that path.
- Pause and use next/previous. Confirm the diagram, OSI layer, explanation, and inspector stay synchronized.
- Scrub to a wire or router step. HTTP payload should be readable; HTTPS payload should be symbolic encrypted data.
- Inspect router-in, route, and router-out: TTL changes 64 → 63, Ethernet MACs change, endpoint IPs/ports stay the same.
- Jump to Return. Verify source/destination reverse and the response begins with TTL 64.
- Play through to completion. Replay should start from step one.
- Open device/layer explanations and the help dialog. Closing should restore focus to the trigger.
- Answer all three learning questions. Feedback should identify the correct answer and explain it.
- Try invalid paths (missing slash, spaces, line breaks, fragment) and a valid query path. Invalid submissions should leave the current simulation intact.
- Use keyboard shortcuts outside inputs; verify sliders, tabs, buttons, and dialogs retain their normal keyboard behavior.
- Review at desktop and narrow widths, at enlarged browser zoom, and with reduced motion enabled.

## Verification completed during creation

- 14 simulation tests passed for HTTP and HTTPS.
- TypeScript checking passed.
- Lint passed for authored source; the unchanged starter UI catalog and its unused mobile hook are excluded.
- The static production build passed.
- The local production server returned HTTP 200 for the page, JavaScript, stylesheet, and favicon with the expected content types.
- No browser interaction, screenshot, or automated end-to-end testing was performed. The checklist above is available for hands-on review.
- Optional WebMCP tools were not verified in a supported browser context.
