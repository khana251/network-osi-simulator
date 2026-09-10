/** Pure, deterministic teaching model. No real network traffic or cryptography. */
export type Protocol = 'http' | 'https';
export type Device = 'client' | 'switch' | 'router' | 'server';
export type Layer = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Direction = 'request' | 'response';
export type Unit = 'data' | 'segment' | 'packet' | 'frame' | 'bits';
export type Phase = 'Prepare' | 'Send' | 'Deliver' | 'Return';
export interface Step {
  id: string;
  title: string;
  description: string;
  detail: string;
  layer: Layer;
  device: Device;
  direction: Direction;
  phase: Phase;
  unit: Unit;
  encrypted: boolean;
  routed: boolean;
  position: number;
  link: 'client' | 'server';
}
export const devices: Record<
  Device,
  { name: string; ip: string; role: string; detail: string }
> = {
  client: {
    name: 'Your laptop',
    ip: '192.0.2.10',
    role: 'Client · layers 1–7',
    detail:
      'Your browser creates the HTTP request. The laptop packages it for delivery and later reconstructs the server’s response. Its temporary TCP port is 51514.',
  },
  switch: {
    name: 'Switch',
    ip: 'Ethernet · layer 2',
    role: 'Local delivery · layer 2',
    detail:
      'The switch looks up the destination MAC in its forwarding table and selects a port. It preserves the frame’s addresses and the IP packet’s TTL. Its own MAC is not used for this transit traffic.',
  },
  router: {
    name: 'Router',
    ip: 'Two network interfaces',
    role: 'Between networks · layers 1–3',
    detail:
      'The router chooses the next hop from the destination IP, decrements TTL, and wraps the IP packet in a new Ethernet frame. Here it does no NAT: endpoint IP addresses and TCP ports stay the same.',
  },
  server: {
    name: 'Web server',
    ip: '198.51.100.20',
    role: 'Destination · layers 1–7',
    detail:
      'The server removes the network wrappers and passes data to its web service. With HTTPS, TLS authenticates and decrypts the bytes before HTTP processes the request.',
  },
};
export const mac = {
  client: '02:00:00:00:01:10',
  routerClient: '02:00:00:00:01:01',
  routerServer: '02:00:00:00:02:01',
  server: '02:00:00:00:02:20',
};
export const layers: {
  number: Layer;
  name: string;
  protocol: string;
  color: string;
  description: string;
}[] = [
  {
    number: 7,
    name: 'Application',
    protocol: 'HTTP',
    color: '#6f59c6',
    description:
      'The browser and web server exchange HTTP requests and responses. HTTPS still uses HTTP, carried inside TLS.',
  },
  {
    number: 6,
    name: 'Presentation',
    protocol: 'Encoding · TLS',
    color: '#ad4d94',
    description:
      'A conceptual view of representation and encryption. In this simulator, TLS protects HTTP bytes. TLS lives between HTTP and TCP; this is a teaching mapping, not a separate mandatory OSI protocol.',
  },
  {
    number: 5,
    name: 'Session',
    protocol: 'Conversation context',
    color: '#b37923',
    description:
      'A conceptual responsibility for dialog context. Modern web software combines upper-layer responsibilities. This step adds no header, and TCP connection setup belongs to transport.',
  },
  {
    number: 4,
    name: 'Transport',
    protocol: 'TCP',
    color: '#3973c7',
    description:
      'TCP uses ports to reach the right application and provides an ordered, reliable byte stream. Real HTTP messages may span many TCP segments.',
  },
  {
    number: 3,
    name: 'Network',
    protocol: 'IPv4',
    color: '#188891',
    description:
      'IP addresses identify source and destination hosts across networks. A router forwards packets and reduces their time to live (TTL).',
  },
  {
    number: 2,
    name: 'Data link',
    protocol: 'Ethernet',
    color: '#32916d',
    description:
      'Ethernet MAC addresses deliver a frame on the current network link. A switch forwards frames; a router creates a new frame for the next network.',
  },
  {
    number: 1,
    name: 'Physical',
    protocol: 'Bits & signals',
    color: '#697786',
    description:
      'Physical links carry signals representing bits. There is no extra “physical-layer header.” The moving marker illustrates transmission, not actual wire speed.',
  },
];
export const unitNames: Record<Unit, string> = {
  data: 'Application data',
  segment: 'TCP segment',
  packet: 'IP packet',
  frame: 'Ethernet frame',
  bits: 'Bits on the wire',
};
export function makeSteps(protocol: Protocol): Step[] {
  const secure = protocol === 'https';
  const result: Step[] = [];
  for (const direction of ['request', 'response'] as const) {
    const response = direction === 'response';
    const sender: Device = response ? 'server' : 'client';
    const receiver: Device = response ? 'client' : 'server';
    const start = response ? 92 : 8;
    const finish = response ? 8 : 92;
    const base = {
      direction,
      encrypted: false,
      routed: false,
      position: start,
      link: response ? 'server' : 'client',
    } as const;
    const add = (
      key: string,
      layer: Layer,
      device: Device,
      unit: Unit,
      title: string,
      description: string,
      detail: string,
      overrides: Partial<Step> = {},
    ) => {
      const phase: Phase = response
        ? 'Return'
        : device === 'client'
          ? 'Prepare'
          : device === 'server'
            ? 'Deliver'
            : 'Send';
      result.push({
        ...base,
        id: `${direction}-${key}`,
        layer,
        device,
        unit,
        title,
        description,
        detail,
        phase,
        ...overrides,
      });
    };
    add(
      'application',
      7,
      sender,
      'data',
      response ? 'The server writes back' : 'A request begins in your browser',
      response
        ? 'The web server creates a 200 OK response containing a short message. This response will make its own trip back to your laptop.'
        : 'Your browser creates an HTTP GET request. The path tells the server which resource you want.',
      response
        ? 'The response is a new message: source and destination ports and IP addresses are reversed.'
        : 'HTTP describes the request. It does not decide how the bytes will cross the network.',
    );
    add(
      'presentation',
      6,
      sender,
      'data',
      secure ? 'TLS protects the HTTP message' : 'The message becomes bytes',
      secure
        ? 'TLS encrypts and authenticates the HTTP bytes using keys established earlier. The HTTP method, path, headers, and body are protected in transit.'
        : 'The HTTP message is encoded as bytes. Without TLS, the request and response remain readable on the network.',
      secure
        ? 'The TLS record shown here is illustrative. No real encryption runs in this simulator. Endpoint IP addresses and TCP ports remain visible.'
        : 'Presentation is a conceptual responsibility here. No extra “presentation header” is created.',
      { encrypted: secure },
    );
    add(
      'session',
      5,
      sender,
      'data',
      'Use the existing conversation',
      'The application uses the existing connection for this exchange. No separate session-layer header is added.',
      secure
        ? 'The TCP connection and TLS handshake are already complete. This scenario focuses on application data.'
        : 'The TCP connection is already established. OSI’s upper three layers are often combined in real web software.',
      { encrypted: secure },
    );
    add(
      'transport',
      4,
      sender,
      'segment',
      'TCP adds the application ports',
      `TCP wraps the bytes in a segment. ${response ? 'The response comes from' : 'The request is addressed to'} the web service on port ${secure ? 443 : 80}.`,
      'TCP tracks byte sequence numbers and acknowledgments. For clarity, this small message fits in one illustrated segment.',
      { encrypted: secure },
    );
    add(
      'network',
      3,
      sender,
      'packet',
      'IP addresses the destination',
      'IPv4 wraps the segment in a packet with the source and destination IP addresses. The sender starts this packet with a TTL of 64.',
      'TTL limits how many router hops a packet can survive. These documentation-only IP addresses represent two different subnets.',
      { encrypted: secure },
    );
    add(
      'link',
      2,
      sender,
      'frame',
      'Ethernet addresses the next hop',
      'The destination is on another network, so the sender addresses the Ethernet frame to its default gateway’s MAC address.',
      'The destination IP belongs to the final host. The destination MAC belongs to the router interface on this local network.',
      { encrypted: secure },
    );
    add(
      'wire-out',
      1,
      sender,
      'bits',
      'Bits cross the first link',
      'The network interface sends signals that represent the Ethernet frame. The physical layer transports those bits.',
      secure
        ? 'TLS protects the HTTP bytes on the wire. IP addresses, ports, and link addresses remain visible.'
        : 'HTTP bytes are unencrypted on the wire. Someone able to observe this traffic could read the message.',
      {
        encrypted: secure,
        position: response ? 79 : 21,
        phase: response ? 'Return' : 'Send',
      },
    );
    if (!response)
      add(
        'switch',
        2,
        'switch',
        'frame',
        'The switch forwards the frame',
        'The switch finds the router’s MAC address in its forwarding table and sends the frame toward that port.',
        'The switch leaves the source and destination MAC addresses intact. It does not decrement IP TTL.',
        { encrypted: secure, position: 36 },
      );
    add(
      'router-in',
      2,
      'router',
      'frame',
      'The frame reaches the router',
      'The router receives the frame addressed to its local interface and removes the incoming Ethernet wrapper.',
      'The next step looks inside the IPv4 header to choose the outgoing network.',
      { encrypted: secure, position: 64 },
    );
    add(
      'route',
      3,
      'router',
      'packet',
      'The router chooses the next network',
      'The router forwards toward the destination IP, reduces TTL from 64 to 63, and updates the IPv4 header checksum.',
      'The end-to-end IP addresses and TCP ports stay the same in this scenario. There is no NAT.',
      { encrypted: secure, position: 64, routed: true },
    );
    add(
      'router-out',
      2,
      'router',
      'frame',
      'A new frame for a new network',
      'The router adds a fresh Ethernet wrapper. Its outgoing interface is the source MAC; the receiving host is the destination MAC.',
      'MAC addresses change at this routing boundary because Ethernet delivery is local to a network.',
      {
        encrypted: secure,
        position: 64,
        routed: true,
        link: response ? 'client' : 'server',
      },
    );
    if (response)
      add(
        'switch',
        2,
        'switch',
        'frame',
        'The switch forwards toward your laptop',
        'The switch uses your laptop’s destination MAC to deliver the returning frame to its port.',
        'The response’s IP TTL remains 63. Switching does not consume another router hop.',
        { encrypted: secure, position: 36, routed: true, link: 'client' },
      );
    add(
      'wire-in',
      1,
      receiver,
      'bits',
      'Bits arrive at the destination',
      'The receiving network interface reconstructs the frame from the arriving signals. The data will now move up the receiver’s stack.',
      'The receiver removes each wrapper and hands its contents to the next protocol.',
      {
        encrypted: secure,
        position: response ? 21 : 79,
        routed: true,
        link: response ? 'client' : 'server',
      },
    );
    const arrived: Partial<Step> = {
      encrypted: secure,
      position: finish,
      routed: true,
      link: response ? 'client' : 'server',
    };
    add(
      'receive-link',
      2,
      receiver,
      'frame',
      'Ethernet accepts the local frame',
      'The receiving interface checks the frame addressed to its MAC. It passes the encapsulated IPv4 packet upward.',
      'An Ethernet frame also includes a frame check sequence. It is represented symbolically, not calculated here.',
      arrived,
    );
    add(
      'receive-network',
      3,
      receiver,
      'packet',
      'IP recognizes its destination',
      'IPv4 confirms that this host is the destination and delivers the packet’s TCP payload to transport.',
      'The packet arrived with TTL 63 after passing through one router.',
      arrived,
    );
    add(
      'receive-transport',
      4,
      receiver,
      'segment',
      'TCP delivers the ordered bytes',
      `TCP uses destination port ${response ? 51514 : secure ? 443 : 80} to deliver the data to the correct connection.`,
      'TCP handles ordering and reliability. Standalone acknowledgments and retransmissions are omitted from this successful exchange.',
      arrived,
    );
    add(
      'receive-session',
      5,
      receiver,
      'data',
      'Continue the application conversation',
      'The received data belongs to the ongoing exchange between the browser and the web server.',
      'This is an OSI teaching checkpoint. No independent session-layer header is removed.',
      arrived,
    );
    add(
      'receive-presentation',
      6,
      receiver,
      'data',
      secure ? 'TLS reveals the HTTP message' : 'Interpret the received bytes',
      secure
        ? 'The receiving endpoint authenticates and decrypts the TLS record. The HTTP message is now readable to the application.'
        : 'The receiver interprets the unencrypted bytes as an HTTP message.',
      secure
        ? 'Only the TLS endpoints decrypt the application data in this model. The switch and router cannot read the protected HTTP message.'
        : 'HTTP provides no transport encryption. The bytes here are the same readable message that crossed the network.',
      { ...arrived, encrypted: false },
    );
    add(
      'receive-application',
      7,
      receiver,
      'data',
      response
        ? 'The response reaches your browser'
        : 'The web server reads the request',
      response
        ? 'Your browser receives 200 OK and the response body. The complete request-and-response journey is finished.'
        : 'The server reads the HTTP method, path, and headers. Next it will build a response and send it back.',
      response
        ? 'Try the other protocol and compare the wire steps: routing stays the same, while HTTPS protects the HTTP content.'
        : 'HTTPS changes how HTTP is protected in transit; the application still processes an HTTP request.',
      { ...arrived, encrypted: false },
    );
  }
  return result;
}
export function normalizePath(value: string): string {
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.length > 120 ||
    !trimmed.startsWith('/') ||
    /[\s#]|\p{Cc}/u.test(trimmed)
  )
    throw new Error(
      'Use a path starting with /, up to 120 characters, without spaces or #.',
    );
  return encodeURI(trimmed).replace(/%25([0-9a-f]{2})/gi, '%$1');
}
export function httpMessage(direction: Direction, path: string): string {
  if (direction === 'request')
    return `GET ${path} HTTP/1.1\r\nHost: example.test\r\nAccept: text/plain\r\n\r\n`;
  const body = `Hello from the server! You requested ${path}`;
  return `HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${new TextEncoder().encode(body).length}\r\n\r\n${body}`;
}
export function inspectPacket(step: Step, protocol: Protocol, path: string) {
  const response = step.direction === 'response';
  const webPort = protocol === 'https' ? 443 : 80;
  const tcp = ['segment', 'packet', 'frame', 'bits'].includes(step.unit);
  const ip = ['packet', 'frame', 'bits'].includes(step.unit);
  const ethernet = ['frame', 'bits'].includes(step.unit);
  const addresses =
    step.link === 'client'
      ? response
        ? [mac.routerClient, mac.client]
        : [mac.client, mac.routerClient]
      : response
        ? [mac.server, mac.routerServer]
        : [mac.routerServer, mac.server];
  const payload = httpMessage(step.direction, path);
  return {
    payload,
    payloadBytes: new TextEncoder().encode(payload).length,
    visiblePayload: step.encrypted
      ? '[Encrypted TLS application data]\nIllustration only — no real ciphertext.'
      : payload,
    tcp: tcp
      ? {
          sourcePort: response ? webPort : 51514,
          destinationPort: response ? 51514 : webPort,
        }
      : null,
    ip: ip
      ? {
          source: response ? devices.server.ip : devices.client.ip,
          destination: response ? devices.client.ip : devices.server.ip,
          ttl: step.routed ? 63 : 64,
        }
      : null,
    ethernet: ethernet
      ? { source: addresses[0], destination: addresses[1] }
      : null,
  };
}
export const quizzes = [
  {
    question: 'What changes when the router forwards the packet?',
    options: [
      'The destination web server',
      'The Ethernet MAC addresses and IP TTL',
      'The HTTP request path',
    ],
    answer: 1,
    explanation:
      'The router replaces the Ethernet frame and reduces TTL. In this scenario, endpoint IPs, TCP ports, and the HTTP message stay the same.',
  },
  {
    question: 'What can an observer still see with HTTPS?',
    options: [
      'The HTTP path and response body',
      'Only encrypted data, with no addresses',
      'IP addresses and TCP ports',
    ],
    answer: 2,
    explanation:
      'TLS protects the HTTP content. The IP and TCP headers used to deliver that content remain visible.',
  },
  {
    question: 'Which MAC does the laptop use to reach the remote server?',
    options: [
      'The router’s local interface',
      'The server’s MAC',
      'The switch’s own MAC',
    ],
    answer: 0,
    explanation:
      'The server is on a different subnet. Ethernet first delivers the frame to the laptop’s default gateway.',
  },
];
