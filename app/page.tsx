'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Code2,
  Globe,
  Info,
  Laptop,
  Layers3,
  LockKeyhole,
  Maximize2,
  Network,
  Package,
  Pause,
  Play,
  RotateCcw,
  Router,
  Server,
  ShieldCheck,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  devices,
  inspectPacket,
  layers,
  makeSteps,
  normalizePath,
  quizzes,
  unitNames,
  type Device,
  type Layer,
  type Protocol,
  type Step,
} from '@/lib/simulation';

type Detail =
  | { kind: 'layer'; layer: Layer }
  | { kind: 'device'; device: Device }
  | { kind: 'help' }
  | { kind: 'quiz' }
  | null;
const deviceIcons = {
  client: Laptop,
  switch: Network,
  router: Router,
  server: Server,
};
const deviceOrder: Device[] = ['client', 'switch', 'router', 'server'];
const phases = ['Prepare', 'Send', 'Deliver', 'Return'];

function NetworkCanvas({
  step,
  playing,
  onDevice,
  onPacket,
}: {
  step: Step;
  playing: boolean;
  onDevice: (d: Device) => void;
  onPacket: () => void;
}) {
  return (
    <section
      className={`network-canvas ${playing ? 'is-playing' : ''}`}
      aria-label="Interactive network topology"
    >
      <div className="canvas-heading">
        <span className="eyebrow">LIVE NETWORK</span>
        <span className="network-status">
          <i />
          {step.direction === 'request'
            ? 'Outbound request'
            : 'Inbound response'}
        </span>
      </div>
      <div className="network-flow-label">
        {step.direction === 'response' && <ArrowLeft size={15} />}
        <span>
          {step.direction === 'request'
            ? 'Client to server'
            : 'Server to client'}
        </span>
        {step.direction === 'request' && <ArrowRight size={15} />}
      </div>
      <div className="topology">
        <svg
          className="network-lines"
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M48 50 H552" />
          <path
            className="network-line-active"
            d={step.direction === 'request' ? 'M48 50 H552' : 'M552 50 H48'}
          />
        </svg>
        <div className="subnet-boundary" aria-hidden="true" />
        {deviceOrder.map((id, i) => {
          const Icon = deviceIcons[id];
          return (
            <button
              key={id}
              className={`device-node ${step.device === id ? 'active' : ''}`}
              style={{ left: `${8 + i * 28}%` }}
              onClick={() => onDevice(id)}
              aria-label={`Inspect ${devices[id].name}`}
            >
              <span className="device-symbol">
                <Icon size={29} strokeWidth={1.6} />
                {step.device === id && <i />}
              </span>
              <strong>{devices[id].name}</strong>
              <small>
                {id === 'client'
                  ? '192.0.2.10'
                  : id === 'server'
                    ? '198.51.100.20'
                    : id === 'switch'
                      ? 'Layer 2'
                      : 'Layer 3'}
              </small>
            </button>
          );
        })}
        <button
          className={`packet-marker ${step.encrypted ? 'encrypted' : ''}`}
          style={{ left: `${step.position}%` }}
          onClick={onPacket}
          aria-label="Inspect the current packet"
        >
          {step.encrypted ? <LockKeyhole size={13} /> : <Package size={14} />}
          <span>
            {step.encrypted
              ? 'TLS'
              : step.unit === 'data'
                ? 'HTTP'
                : step.unit === 'bits'
                  ? 'BITS'
                  : step.unit.toUpperCase()}
          </span>
        </button>
      </div>
      <div className="subnet-labels">
        <span>
          <i /> LOCAL NETWORK <code>192.0.2.0/24</code>
        </span>
        <span>
          SERVER NETWORK <code>198.51.100.0/24</code>
        </span>
      </div>
      <div className="canvas-bottom">
        <span>
          <span className="tiny-line" /> Ethernet connection
        </span>
        <span>
          Click a device to explore <Maximize2 size={12} />
        </span>
      </div>
    </section>
  );
}

function PacketInspector({
  step,
  protocol,
  path,
  view,
  onView,
  onLayer,
}: {
  step: Step;
  protocol: Protocol;
  path: string;
  view: string;
  onView: (v: string) => void;
  onLayer: (l: Layer) => void;
}) {
  const packet = inspectPacket(step, protocol, path);
  return (
    <aside className="packet-panel panel" aria-label="Packet inspector">
      <div className="panel-heading">
        <h2>
          <Package size={17} /> Packet inspector
        </h2>
        <span className="mini-tag">
          {step.direction === 'request' ? 'REQ' : 'RES'}
        </span>
      </div>
      <Tabs
        value={view}
        onValueChange={(v) => onView(String(v))}
        className="inspector-tabs"
      >
        <TabsList variant="line">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="payload">Payload</TabsTrigger>
        </TabsList>
        <TabsContent value="structure">
          <div className="unit-heading">
            <span className="eyebrow">CURRENT DATA UNIT</span>
            <strong>{unitNames[step.unit]}</strong>
          </div>
          <div
            className="packet-wrappers"
            aria-label="Current packet encapsulation"
          >
            {packet.ethernet && (
              <div className="wrapper ethernet">
                <button onClick={() => onLayer(2)}>
                  <span>ETHERNET</span>
                  <span>Frame</span>
                </button>
                <div className="wrapper ip">
                  <button onClick={() => onLayer(3)}>
                    <span>IPv4</span>
                    <span>Packet</span>
                  </button>
                  <div className="wrapper tcp">
                    <button onClick={() => onLayer(4)}>
                      <span>TCP</span>
                      <span>Segment</span>
                    </button>
                    <PayloadBlock
                      encrypted={step.encrypted}
                      onClick={() => onView('payload')}
                    />
                  </div>
                </div>
                <span className="fcs-label">FCS · frame check sequence</span>
              </div>
            )}
            {!packet.ethernet && packet.ip && (
              <div className="wrapper ip">
                <button onClick={() => onLayer(3)}>
                  <span>IPv4</span>
                  <span>Packet</span>
                </button>
                <div className="wrapper tcp">
                  <button onClick={() => onLayer(4)}>
                    <span>TCP</span>
                    <span>Segment</span>
                  </button>
                  <PayloadBlock
                    encrypted={step.encrypted}
                    onClick={() => onView('payload')}
                  />
                </div>
              </div>
            )}
            {!packet.ip && packet.tcp && (
              <div className="wrapper tcp">
                <button onClick={() => onLayer(4)}>
                  <span>TCP</span>
                  <span>Segment</span>
                </button>
                <PayloadBlock
                  encrypted={step.encrypted}
                  onClick={() => onView('payload')}
                />
              </div>
            )}
            {!packet.tcp && (
              <PayloadBlock
                encrypted={step.encrypted}
                onClick={() => onView('payload')}
              />
            )}
          </div>
          <div className="packet-fields">
            {packet.tcp && (
              <Field
                label="TCP ports"
                value={`${packet.tcp.sourcePort} → ${packet.tcp.destinationPort}`}
              />
            )}
            {packet.ip && (
              <>
                <Field label="Source IP" value={packet.ip.source} />
                <Field label="Destination IP" value={packet.ip.destination} />
                <Field label="Time to live" value={`${packet.ip.ttl} hops`} />
              </>
            )}
            {packet.ethernet && (
              <>
                <Field label="Source MAC" value={packet.ethernet.source} />
                <Field
                  label="Destination MAC"
                  value={packet.ethernet.destination}
                />
              </>
            )}
            {!packet.tcp && (
              <>
                <Field label="Application" value="HTTP/1.1" />
                <Field
                  label="Plaintext size"
                  value={`${packet.payloadBytes} bytes`}
                />
                <Field
                  label="Representation"
                  value={
                    step.encrypted
                      ? 'TLS-protected bytes'
                      : 'Readable HTTP bytes'
                  }
                />
              </>
            )}
          </div>
          <p className="inspector-note">
            <Info size={14} />
            {step.unit === 'bits'
              ? 'Signals carry this frame. The physical layer adds no extra header.'
              : 'Select a wrapper to learn why it is here.'}
          </p>
        </TabsContent>
        <TabsContent value="payload">
          <div
            className={`payload-status ${step.encrypted ? 'protected' : ''}`}
          >
            {step.encrypted ? <LockKeyhole size={16} /> : <Code2 size={16} />}
            <div>
              <strong>
                {step.encrypted
                  ? 'Encrypted in transit'
                  : 'Readable HTTP message'}
              </strong>
              <span>
                {step.encrypted
                  ? 'The network cannot read this HTTP content.'
                  : 'The application can read these bytes.'}
              </span>
            </div>
          </div>
          <pre className="payload-code">{packet.visiblePayload}</pre>
          <p className="inspector-note">
            <Info size={14} />
            {step.encrypted
              ? 'Illustrative TLS record. Its HTTP content is hidden; IP addresses and TCP ports remain visible.'
              : protocol === 'http'
                ? 'HTTP remains readable throughout this entire journey.'
                : 'HTTPS encrypts this message at the sender and decrypts it at the receiving endpoint.'}
          </p>
        </TabsContent>
      </Tabs>
      <div className={`security-foot ${step.encrypted ? 'secure' : ''}`}>
        {step.encrypted ? <ShieldCheck size={16} /> : <Globe size={16} />}
        <span>
          {step.encrypted
            ? 'HTTP content protected by TLS'
            : protocol === 'http'
              ? 'HTTP · no transport encryption'
              : 'HTTP visible at the endpoint'}
        </span>
      </div>
    </aside>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}
function PayloadBlock({
  encrypted,
  onClick,
}: {
  encrypted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`payload-block ${encrypted ? 'tls' : ''}`}
      onClick={onClick}
    >
      {encrypted ? <LockKeyhole size={16} /> : <Code2 size={16} />}
      <span>
        {encrypted ? 'TLS record' : 'HTTP data'}
        <small>
          {encrypted
            ? 'Encrypted application data'
            : 'Request or response bytes'}
        </small>
      </span>
      <ChevronRight size={14} />
    </button>
  );
}

export default function Home() {
  const [protocol, setProtocol] = useState<Protocol>('https');
  const [draftPath, setDraftPath] = useState('/hello');
  const [path, setPath] = useState('/hello');
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1');
  const [view, setView] = useState('structure');
  const [detail, setDetail] = useState<Detail>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const steps = useMemo(() => makeSteps(protocol), [protocol]);
  const step = steps[index];
  const currentLayer = layers.find((l) => l.number === step.layer)!;
  const complete = index === steps.length - 1;
  const responseIndex = steps.findIndex((s) => s.direction === 'response');
  const receiving = step.id.includes('receive-') || step.id.endsWith('wire-in');
  const openDetail = (value: Detail) => {
    setPlaying(false);
    setDetail(value);
  };
  const goTo = useCallback(
    (next: number) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(steps.length - 1, next)));
    },
    [steps.length],
  );
  const changeProtocol = (value: string) => {
    if (value !== 'http' && value !== 'https') return;
    setProtocol(value);
    setPlaying(false);
    setIndex(0);
    setError('');
  };
  const togglePlay = useCallback(() => {
    if (complete) {
      setIndex(0);
      setPlaying(true);
    } else setPlaying((value) => !value);
  }, [complete]);
  const send = () => {
    try {
      const next = normalizePath(draftPath);
      setPath(next);
      setError('');
      setIndex(0);
      setPlaying(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => {
        if (index >= steps.length - 2) setPlaying(false);
        setIndex((i) => Math.min(i + 1, steps.length - 1));
      },
      2600 / Number(speed),
    );
    return () => window.clearTimeout(timer);
  }, [playing, index, speed, steps.length]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        detail ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof Element &&
          event.target.closest(
            'input,textarea,select,button,a,[role="slider"],[role="tab"],[contenteditable="true"]',
          ))
      )
        return;
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        goTo(index + 1);
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        goTo(index - 1);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [detail, index, goTo, togglePlay]);
  const live = useRef({ protocol, path, index, steps, step });
  useEffect(() => {
    live.current = { protocol, path, index, steps, step };
  }, [protocol, path, index, steps, step]);
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const register = (tool: Tool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: controller.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser API. */
      }
    };
    register({
      name: 'read_simulation',
      description:
        'Read the current HTTP/HTTPS simulation step and packet structure.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => {
        const state = live.current;
        const packet = inspectPacket(state.step, state.protocol, state.path);
        return {
          protocol: state.protocol,
          step: state.index + 1,
          totalSteps: state.steps.length,
          title: state.step.title,
          encrypted: state.step.encrypted,
          tcp: packet.tcp,
          ip: packet.ip,
          ethernet: packet.ethernet,
        };
      },
    });
    register({
      name: 'configure_simulation',
      description:
        'Choose HTTP or HTTPS and a request path, then show a paused simulation at a chosen step. All traffic is simulated locally.',
      inputSchema: {
        type: 'object',
        properties: {
          protocol: { type: 'string', enum: ['http', 'https'] },
          path: { type: 'string' },
          step: { type: 'integer', minimum: 1, maximum: 36 },
        },
        required: ['protocol', 'path'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input) => {
        if (!input || typeof input !== 'object')
          throw new Error('Expected an object.');
        const value = input as Record<string, unknown>;
        if (
          Object.keys(value).some(
            (k) => !['protocol', 'path', 'step'].includes(k),
          )
        )
          throw new Error('Unknown input field.');
        if (value.protocol !== 'http' && value.protocol !== 'https')
          throw new Error('Protocol must be http or https.');
        if (typeof value.path !== 'string')
          throw new Error('Path must be a string.');
        const nextPath = normalizePath(value.path);
        const nextSteps = makeSteps(value.protocol);
        const nextStep = value.step ?? 1;
        if (
          typeof nextStep !== 'number' ||
          !Number.isInteger(nextStep) ||
          nextStep < 1 ||
          nextStep > nextSteps.length
        )
          throw new Error('Step is out of range.');
        flushSync(() => {
          setPlaying(false);
          setProtocol(value.protocol as Protocol);
          setDraftPath(value.path as string);
          setPath(nextPath);
          setIndex(nextStep - 1);
          setError('');
          setDetail(null);
        });
        return {
          protocol: value.protocol,
          path: nextPath,
          step: nextStep,
          title: nextSteps[nextStep - 1].title,
        };
      },
    });
    return () => controller.abort();
  }, []);
  const selectedLayer =
    detail?.kind === 'layer'
      ? layers.find((l) => l.number === detail.layer)
      : null;
  const selectedDevice =
    detail?.kind === 'device' ? devices[detail.device] : null;
  const quiz = quizzes[quizIndex];
  const answered = answers[quizIndex] !== undefined;
  return (
    <main className="app-shell">
      <header className="app-header">
        <Link className="brand-link" href="/" aria-label="Packet Lab home">
          <span className="brand-icon">
            <Layers3 size={21} />
          </span>
          <strong>
            packet<span>lab</span>
            <span className="brand-dot">.</span>
          </strong>
        </Link>
        <div className="header-divider" />
        <span className="header-context">Network OSI Simulator</span>
        <span className="version">V1</span>
        <Button
          variant="ghost"
          className="guide-button"
          onClick={() => openDetail({ kind: 'help' })}
        >
          <BookOpen size={16} /> How it works
        </Button>
      </header>
      <section className="intro">
        <div>
          <div className="intro-kicker">
            <span className="blue-dot" /> INTERACTIVE NETWORK LAB
          </div>
          <h1>Follow the request.</h1>
          <p>From your browser to the server. Every layer, every hop.</p>
        </div>
        <Button
          variant="outline"
          className="quick-check"
          onClick={() => openDetail({ kind: 'quiz' })}
        >
          <CircleHelp size={16} /> Check your understanding{' '}
          <ArrowRight size={15} />
        </Button>
      </section>
      <Tabs
        value={protocol}
        onValueChange={(v) => changeProtocol(String(v))}
        className="protocol-root"
      >
        <section
          className="request-bar"
          aria-label="Configure a simulated web request"
        >
          <div className="request-kind">
            <span className="eyebrow">PROTOCOL</span>
            <TabsList className="protocol-tabs">
              <TabsTrigger value="http">
                <Globe size={14} />
                HTTP
              </TabsTrigger>
              <TabsTrigger value="https">
                <LockKeyhole size={14} />
                HTTPS
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="request-divider" />
          <form
            className="request-form"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label className={`url-input ${error ? 'has-error' : ''}`}>
              <span className="method">GET</span>
              <span className="url-origin">{protocol}://example.test</span>
              <input
                aria-label="Request path"
                aria-invalid={!!error}
                aria-describedby={error ? 'path-error' : undefined}
                value={draftPath}
                maxLength={120}
                onChange={(e) => {
                  setDraftPath(e.target.value);
                  setError('');
                }}
                spellCheck={false}
              />
            </label>
            <Button className="send-button" type="submit">
              <Play size={15} fill="currentColor" />
              Send request
            </Button>
          </form>
        </section>
        {error && (
          <p role="alert" id="path-error" className="path-error">
            {error}
          </p>
        )}
        <div className="scenario-note">
          <span>
            {protocol === 'https' ? (
              <LockKeyhole size={13} />
            ) : (
              <Globe size={13} />
            )}
            <strong>{protocol === 'https' ? 'HTTPS' : 'HTTP'}</strong> ·
            HTTP/1.1{' '}
            {protocol === 'https'
              ? 'over TLS 1.3 · Port 443'
              : 'over TCP · Port 80'}
          </span>
          <button onClick={() => openDetail({ kind: 'help' })}>
            Connections already established <Info size={13} />
          </button>
        </div>
        <TabsContent value={protocol} className="simulation-content">
          <div className="workspace">
            <aside className="layer-panel panel">
              <div className="panel-heading">
                <h2>
                  <Layers3 size={17} /> OSI model
                </h2>
                <span className="mini-tag">7 LAYERS</span>
              </div>
              <div className="stack-context">
                <span>{devices[step.device].name}</span>
                {step.device === 'router' || step.device === 'switch' ? (
                  <Network size={14} />
                ) : receiving ? (
                  <ArrowUp size={15} />
                ) : (
                  <ArrowDown size={15} />
                )}
              </div>
              <div className="layer-list">
                {layers.map((layer) => (
                  <button
                    key={layer.number}
                    className={`layer-row ${step.layer === layer.number ? 'active' : ''} ${(step.device === 'switch' && layer.number > 2) || (step.device === 'router' && layer.number > 3) ? 'not-used' : ''}`}
                    style={{ '--layer-color': layer.color } as CSSProperties}
                    onClick={() =>
                      openDetail({ kind: 'layer', layer: layer.number })
                    }
                    aria-label={`Learn about layer ${layer.number}, ${layer.name}`}
                    aria-current={
                      step.layer === layer.number ? 'step' : undefined
                    }
                  >
                    <span className="layer-number">{layer.number}</span>
                    <span className="layer-name">
                      <strong>{layer.name}</strong>
                      <small>
                        {layer.number === 6 && protocol === 'http'
                          ? 'Encoding'
                          : layer.number === 7
                            ? protocol.toUpperCase()
                            : layer.protocol}
                      </small>
                    </span>
                    {step.layer === layer.number ? (
                      <span className="layer-active-dot" />
                    ) : (
                      <ChevronRight className="layer-chevron" size={13} />
                    )}
                  </button>
                ))}
              </div>
              <div className="stack-footer">
                <span className="mini-layer-line" />{' '}
                {step.device === 'router' || step.device === 'switch'
                  ? 'Forwarding between links'
                  : receiving
                    ? 'Decapsulation · unwrapping data'
                    : 'Encapsulation · wrapping data'}
              </div>
            </aside>
            <div className="journey-column">
              <NetworkCanvas
                step={step}
                playing={playing}
                onDevice={(device) => openDetail({ kind: 'device', device })}
                onPacket={() => setView('payload')}
              />
              <section
                className={`step-card ${complete ? 'complete' : ''}`}
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="step-card-heading">
                  <span className="step-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="layer-badge"
                    style={{ color: currentLayer.color }}
                  >
                    {complete ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <span
                        className="badge-dot"
                        style={{ background: currentLayer.color }}
                      />
                    )}
                    {complete
                      ? 'JOURNEY COMPLETE'
                      : `LAYER ${step.layer} · ${currentLayer.name.toUpperCase()}`}
                  </span>
                  <span className="step-device">
                    {devices[step.device].name}
                  </span>
                </div>
                <h2>{step.title}</h2>
                <p>{step.description}</p>
                <div className="step-insight">
                  <Info size={15} />
                  <span>{step.detail}</span>
                </div>
              </section>
            </div>
            <PacketInspector
              step={step}
              protocol={protocol}
              path={path}
              view={view}
              onView={setView}
              onLayer={(layer) => openDetail({ kind: 'layer', layer })}
            />
          </div>
        </TabsContent>
      </Tabs>
      <section className="playback panel" aria-label="Simulation playback">
        <div className="playback-top">
          <div className="playback-actions">
            <Button
              variant="ghost"
              className="control"
              aria-label="Reset simulation"
              title="Reset"
              onClick={() => goTo(0)}
            >
              <RotateCcw size={17} />
            </Button>
            <span className="controls-divider" />
            <Button
              variant="ghost"
              className="control"
              aria-label="Previous step"
              title="Previous step"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <SkipBack size={17} />
            </Button>
            <Button
              className="play-control"
              aria-label={
                playing
                  ? 'Pause simulation'
                  : complete
                    ? 'Replay simulation'
                    : 'Play simulation'
              }
              onClick={togglePlay}
            >
              {playing ? (
                <Pause size={17} fill="currentColor" />
              ) : complete ? (
                <RotateCcw size={17} />
              ) : (
                <Play size={17} fill="currentColor" />
              )}
              {playing ? 'Pause' : complete ? 'Replay' : 'Play'}
            </Button>
            <Button
              variant="ghost"
              className="control"
              aria-label="Next step"
              title="Next step"
              disabled={complete}
              onClick={() => goTo(index + 1)}
            >
              <SkipForward size={17} />
            </Button>
          </div>
          <div className="phase-progress">
            {phases.map((phase, i) => (
              <button
                key={phase}
                className={
                  step.phase === phase
                    ? 'active'
                    : phases.indexOf(step.phase) > i
                      ? 'passed'
                      : ''
                }
                onClick={() => goTo(steps.findIndex((s) => s.phase === phase))}
              >
                <span>
                  {phases.indexOf(step.phase) > i ? <Check size={11} /> : i + 1}
                </span>
                {phase}
                {i < 3 && <ChevronRight size={13} />}
              </button>
            ))}
          </div>
          <div className="speed-control">
            <span>Speed</span>
            <Select value={speed} onValueChange={(v) => v && setSpeed(v)}>
              <SelectTrigger aria-label="Playback speed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['0.5', '1', '1.5', '2'].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}×
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="timeline">
          <span className="step-counter">
            Step <strong>{String(index + 1).padStart(2, '0')}</strong>
            <span> / {steps.length}</span>
          </span>
          <div className="timeline-range">
            <Slider
              aria-label="Simulation step"
              value={[index]}
              min={0}
              max={steps.length - 1}
              step={1}
              onValueChange={(v) => goTo(Array.isArray(v) ? v[0] : v)}
            />
            <div className="timeline-labels">
              <button onClick={() => goTo(0)}>Request begins</button>
              <button onClick={() => goTo(responseIndex)}>
                Server responds
              </button>
              <button onClick={() => goTo(steps.length - 1)}>
                Response arrives
              </button>
            </div>
          </div>
          <span className={`playback-state ${playing ? 'running' : ''}`}>
            <i />
            {complete
              ? 'Complete'
              : playing
                ? 'Playing'
                : index === 0
                  ? 'Ready'
                  : 'Paused'}
          </span>
        </div>
      </section>
      <footer className="app-footer">
        <span>
          <Info size={14} /> A simplified model of real networks.{' '}
          <button onClick={() => openDetail({ kind: 'help' })}>
            See what’s included
          </button>
        </span>
        <span className="keyboard-hint">
          <kbd>Space</kbd> play / pause <kbd>←</kbd>
          <kbd>→</kbd> step
        </span>
      </footer>
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
      >
        <DialogContent className="explanation-dialog">
          <DialogHeader>
            <span className="eyebrow">
              {selectedLayer
                ? `THE OSI MODEL · LAYER ${selectedLayer.number}`
                : selectedDevice
                  ? 'EXPLORE THE NETWORK'
                  : detail?.kind === 'quiz'
                    ? 'A QUICK CHECK'
                    : 'WELCOME TO PACKET LAB'}
            </span>
            <DialogTitle>
              {selectedLayer
                ? selectedLayer.name
                : selectedDevice
                  ? selectedDevice.name
                  : detail?.kind === 'quiz'
                    ? 'Put the pieces together.'
                    : 'A web request, one step at a time.'}
            </DialogTitle>
            <DialogDescription>
              {selectedLayer
                ? 'Understand the job this layer does.'
                : selectedDevice
                  ? selectedDevice.role
                  : detail?.kind === 'quiz'
                    ? `Question ${quizIndex + 1} of ${quizzes.length}`
                    : 'Choose a protocol, send a request, and follow its journey.'}
            </DialogDescription>
          </DialogHeader>
          {selectedLayer && (
            <>
              <p className="dialog-body">{selectedLayer.description}</p>
              <div className="dialog-callout">
                <strong>In this lab</strong>
                {selectedLayer.number === 6
                  ? protocol === 'https'
                    ? 'HTTPS adds TLS protection before TCP. You can see the payload become unreadable in transit.'
                    : 'HTTP uses readable bytes. Switch to HTTPS to see TLS protect them.'
                  : selectedLayer.number === 5
                    ? 'Connection setup is already complete. This conceptual step adds no packet wrapper.'
                    : `Click through the timeline to see ${selectedLayer.name.toLowerCase()} at the sender and receiver.`}
              </div>
            </>
          )}
          {selectedDevice && (
            <>
              <p className="dialog-body">{selectedDevice.detail}</p>
              <div className="dialog-callout">
                <strong>Address / identity</strong>
                <code>{selectedDevice.ip}</code>
                {detail?.kind === 'device' && detail.device === 'router' && (
                  <small>
                    Client side: 192.0.2.1 · Server side: 198.51.100.1
                  </small>
                )}
              </div>
            </>
          )}
          {detail?.kind === 'help' && (
            <>
              <ol className="help-steps">
                <li>
                  <span>1</span>
                  <div>
                    <strong>Choose HTTP or HTTPS</strong>
                    <p>
                      Use the same GET request to compare plain HTTP with
                      TLS-protected HTTP.
                    </p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <strong>Follow the packet</strong>
                    <p>
                      Play the journey or step manually. Click devices, layers,
                      and packet wrappers to explore.
                    </p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <strong>Watch the response return</strong>
                    <p>
                      The server creates a new response. Addresses and ports
                      reverse; the same wrapping process happens again.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="dialog-callout">
                <strong>What this V1 assumes</strong>
                <p>
                  DNS and ARP are resolved. TCP is connected; for HTTPS, TLS 1.3
                  is established. Each message fits one illustrated segment. No
                  NAT, loss, fragmentation, or standalone acknowledgments are
                  shown.
                </p>
                <p>
                  The upper OSI layers describe responsibilities, not seven
                  separate protocol headers. TLS encryption and wire signals are
                  illustrative. All traffic is simulated locally.
                </p>
              </div>
              <p className="source-links">
                Protocol references:{' '}
                <a
                  href="https://www.rfc-editor.org/rfc/rfc9112.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  HTTP/1.1
                </a>
                <a
                  href="https://www.rfc-editor.org/rfc/rfc8446.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  TLS 1.3
                </a>
                <a
                  href="https://www.rfc-editor.org/rfc/rfc1812.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  IPv4 routing
                </a>
              </p>
            </>
          )}
          {detail?.kind === 'quiz' && (
            <>
              <h3 className="quiz-question">{quiz.question}</h3>
              <div className="quiz-options">
                {quiz.options.map((option, i) => (
                  <button
                    key={option}
                    disabled={answered}
                    className={`${answered && i === quiz.answer ? 'correct' : ''} ${answers[quizIndex] === i && i !== quiz.answer ? 'incorrect' : ''}`}
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [quizIndex]: i }))
                    }
                  >
                    <span>{String.fromCharCode(65 + i)}</span>
                    {option}
                    {answered && i === quiz.answer && (
                      <CheckCircle2 size={18} />
                    )}
                  </button>
                ))}
              </div>
              {answered && (
                <div className="quiz-result">
                  <strong>
                    {answers[quizIndex] === quiz.answer
                      ? 'That’s right.'
                      : 'Here’s how it works.'}
                  </strong>
                  <p>{quiz.explanation}</p>
                </div>
              )}
              <div className="quiz-navigation">
                <span>
                  {
                    Object.entries(answers).filter(
                      ([q, a]) => quizzes[Number(q)].answer === a,
                    ).length
                  }{' '}
                  / {quizzes.length} correct
                </span>
                {quizIndex < quizzes.length - 1 ? (
                  <Button
                    disabled={!answered}
                    onClick={() => setQuizIndex((i) => i + 1)}
                  >
                    Next question <ArrowRight size={15} />
                  </Button>
                ) : (
                  <Button
                    disabled={!answered}
                    onClick={() => {
                      setQuizIndex(0);
                      setAnswers({});
                    }}
                  >
                    Try again <RotateCcw size={15} />
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
