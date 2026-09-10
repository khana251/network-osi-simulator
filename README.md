# Packet Lab — Network OSI Simulator

A local, interactive V1 for learning how an **HTTP or HTTPS request** travels from a browser to a web server and how the response returns. All simulation code, interface assets, tests, configuration, and documentation live in this folder. No Git repository has been initialized.

## Run locally

Use **Node.js 22.18+** (Node 24 LTS recommended) and **pnpm 11.19.0**. You can enable pnpm with Corepack where available, or install that version of pnpm using npm.

```sh
pnpm install
pnpm dev
```

Open the local address printed in the terminal, normally **http://127.0.0.1:3000**. Keep that terminal running. Press Ctrl+C to stop it.

For a production build:

```sh
pnpm build
pnpm start
```

The production server uses only Node's standard library and listens on localhost. Use `PORT=3001 pnpm start` to choose another port. The static website is generated in `dist/client/`; it can later be served by any static web host. Opening `dist/client/index.html` directly with `file://` is not supported.

## Review the V1

1. Select **HTTP** or **HTTPS**, edit the request path (for example `/hello` or `/products?id=42`), then choose **Send request**.
2. Pause, move forward or backward, or drag the timeline. The diagram, layer highlight, explanation, and packet inspector all reflect the same step.
3. Click a device or OSI layer for its role. Click an encapsulation wrapper to learn about it, or choose **Payload** to inspect the HTTP bytes.
4. Compare a wire or router step between HTTP and HTTPS. HTTP stays readable; HTTPS hides the HTTP content while IP addresses and TCP ports remain visible.
5. Jump to **Return** to watch the server's new response travel back. Try the three questions under **Check your understanding**.

Keyboard shortcuts when focus is outside controls: **Space** plays or pauses; **left/right arrows** step backward or forward. Native and component keyboard behavior is preserved inside inputs, tabs, buttons, and the timeline. The layout adapts to smaller screens and respects reduced-motion preferences.

The request is a simulated GET to `example.test`. It never contacts a real web server. Editing the path takes effect when **Send request** is pressed. Changing protocol resets playback to the start while keeping the last submitted path.

## Included

- HTTP/1.1 over TCP (port 80) and HTTP/1.1 over TLS 1.3 over TCP (port 443).
- A deterministic, 36-step request/response journey through laptop → switch → router → server.
- Visible encapsulation, decapsulation, MAC replacement at the router, and TTL changes.
- Simulated TLS encryption/decryption, packet structure and payload views.
- Replay, manual stepping, scrubbing, speed selection, phase shortcuts, and learning questions.
- Local system fonts and a local SVG favicon. No backend, accounts, analytics, remote images, or remote fonts.

## Deliberate simplifications

DNS/ARP and switch tables are populated. TCP connection setup and, for HTTPS, the TLS handshake have already completed. Messages fit one illustrated TCP segment. Standalone ACKs, retransmission, fragmentation, NAT, HTTP/2, HTTP/3, QUIC, and topology editing are outside V1.

OSI layers 5 and 6 are conceptual learning checkpoints. This is not a seven-header Internet protocol implementation. TLS has real record framing between HTTP and TCP; the presentation-layer mapping is an analogy. Encryption, Ethernet FCS, and physical signals are illustrative rather than calculated. The packet inspector shows the relevant headers, not a complete packet capture. Source addresses use reserved documentation ranges.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the state model and [docs/PROTOCOL-NOTES.md](docs/PROTOCOL-NOTES.md) for protocol references.

## Development checks

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

The engine tests cover both directions, HTTP/HTTPS visibility, gateway addressing, frame replacement, TTL, ports, deterministic replay, path validation, and HTTP message framing. Lint checks authored source; unchanged starter UI primitives and their unused mobile hook are excluded. Browser UI behavior still benefits from hands-on review; automated end-to-end browser tests are not included in this V1.

## Project layout

```text
app/                    Page, layout metadata, and responsive styles
lib/simulation.ts       Pure network simulation and teaching content
components/ui/          Accessible UI primitives from the starter
hooks/                  Shared starter hooks
public/                 Local assets
scripts/serve.mjs       Dependency-free production preview server
tests/                 Simulation tests
docs/                  Architecture, protocol notes, review checklist
package.json            Commands and pinned dependencies
pnpm-lock.yaml          Reproducible dependency resolution
pnpm-workspace.yaml     Explicit dependency lifecycle-script policy
.npmrc                  Project-local package store configuration
.gitignore              Excludes dependencies, caches, and generated output
.openai/hosting.json     Static-output metadata; no registered/deployed site
```

`node_modules/`, `.cache/`, and `dist/client/` are generated locally and ignored by Git. There are no secrets or machine-specific absolute paths in the source. The package store is configured inside `.cache/`.

## Make it a Git repository later

From this folder, when you choose:

```sh
git init
git add .
git commit -m "Initial Packet Lab V1"
```

The provided `.gitignore` keeps generated files and dependencies out of that first commit. Publishing and remote repository setup are separate future choices.
