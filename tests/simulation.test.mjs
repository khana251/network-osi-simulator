import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeSteps,
  inspectPacket,
  httpMessage,
  mac,
  normalizePath,
} from '../lib/simulation.ts';

for (const protocol of ['http', 'https']) {
  const steps = makeSteps(protocol);
  const at = (id) => steps.find((s) => s.id === id);
  const packet = (id) => inspectPacket(at(id), protocol, '/hello');
  test(`${protocol}: complete deterministic request and response`, () => {
    assert.deepEqual(makeSteps(protocol), steps);
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length);
    assert.equal(steps[0].id, 'request-application');
    assert.equal(steps.at(-1).id, 'response-receive-application');
    assert.equal(steps.length, 36);
    assert.ok(steps.every((s) => s.position >= 0 && s.position <= 100));
  });
  test(`${protocol}: off-subnet Ethernet delivery targets gateway, not server`, () => {
    assert.deepEqual(packet('request-wire-out').ethernet, {
      source: mac.client,
      destination: mac.routerClient,
    });
    assert.deepEqual(
      packet('request-switch').ethernet,
      packet('request-wire-out').ethernet,
    );
    assert.equal(packet('request-switch').ip.ttl, 64);
    assert.deepEqual(packet('request-router-out').ethernet, {
      source: mac.routerServer,
      destination: mac.server,
    });
  });
  test(`${protocol}: router preserves endpoints and ports, decrements TTL once`, () => {
    const before = packet('request-router-in'),
      after = packet('request-router-out');
    assert.equal(after.ip.source, before.ip.source);
    assert.equal(after.ip.destination, before.ip.destination);
    assert.deepEqual(after.tcp, before.tcp);
    assert.equal(before.ip.ttl, 64);
    assert.equal(after.ip.ttl, 63);
    assert.equal(packet('request-receive-network').ip.ttl, 63);
    assert.equal(packet('request-route').ethernet, null);
  });
  test(`${protocol}: return packet starts a fresh TTL and reverses endpoints`, () => {
    const request = packet('request-network'),
      response = packet('response-network');
    assert.equal(response.ip.source, request.ip.destination);
    assert.equal(response.ip.destination, request.ip.source);
    assert.equal(response.tcp.sourcePort, request.tcp.destinationPort);
    assert.equal(response.tcp.destinationPort, request.tcp.sourcePort);
    assert.equal(response.ip.ttl, 64);
    assert.deepEqual(packet('response-router-out').ethernet, {
      source: mac.routerClient,
      destination: mac.client,
    });
    assert.equal(packet('response-switch').ip.ttl, 63);
    assert.equal(packet('response-receive-network').ip.ttl, 63);
  });
  test(`${protocol}: correct port and encapsulation boundaries`, () => {
    assert.equal(
      packet('request-transport').tcp.destinationPort,
      protocol === 'https' ? 443 : 80,
    );
    assert.equal(packet('request-transport').ip, null);
    assert.equal(packet('request-network').ethernet, null);
    assert.equal(packet('request-receive-session').tcp, null);
    assert.equal(packet('response-receive-application').ethernet, null);
    assert.equal(packet('request-session').tcp, null);
  });
  test(`${protocol}: payload visibility follows endpoint encryption/decryption`, () => {
    assert.match(packet('request-application').visiblePayload, /GET \/hello/);
    assert.match(
      packet('request-receive-presentation').visiblePayload,
      /GET \/hello/,
    );
    assert.match(
      packet('response-receive-application').visiblePayload,
      /200 OK/,
    );
    for (const direction of ['request', 'response']) {
      for (const suffix of [
        'wire-out',
        'router-in',
        'route',
        'router-out',
        'wire-in',
        'receive-transport',
      ]) {
        const current = at(`${direction}-${suffix}`);
        assert.equal(current.encrypted, protocol === 'https');
        const visible = inspectPacket(
          current,
          protocol,
          '/hello',
        ).visiblePayload;
        if (protocol === 'https') {
          assert.ok(!visible.includes('/hello'));
          assert.match(visible, /Encrypted TLS/);
        } else assert.ok(visible.includes('/hello'));
      }
    }
  });
}
test('path validation prevents HTTP line injection and handles unicode', () => {
  for (const value of [
    '',
    'hello',
    '/a b',
    '/hello\r\nInjected:yes',
    '/a#fragment',
    '/' + 'a'.repeat(120),
  ])
    assert.throws(() => normalizePath(value));
  assert.equal(normalizePath(' /hello?name=Amaan '), '/hello?name=Amaan');
  assert.equal(normalizePath('/café'), '/caf%C3%A9');
  assert.equal(normalizePath('/caf%C3%A9'), '/caf%C3%A9');
  assert.throws(() => normalizePath('/hello\u0001world'));
  assert.throws(() => normalizePath('/hello\u007fworld'));
});
test('HTTP uses CRLF and response content length counts body bytes', () => {
  const request = httpMessage('request', '/hello');
  assert.ok(request.endsWith('\r\n\r\n'));
  assert.ok(!request.replaceAll('\r\n', '').includes('\n'));
  const response = httpMessage('response', '/hello');
  const [head, body] = response.split('\r\n\r\n');
  assert.equal(
    Number(head.match(/Content-Length: (\d+)/)[1]),
    new TextEncoder().encode(body).length,
  );
});
