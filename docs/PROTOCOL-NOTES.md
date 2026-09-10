# Protocol notes and references

The simulator is a teaching model, not a packet capture generator or cryptographic implementation.

## Concrete addressing

| Interface            | IPv4             | MAC               |
| -------------------- | ---------------- | ----------------- |
| Laptop               | 192.0.2.10/24    | 02:00:00:00:01:10 |
| Router facing laptop | 192.0.2.1/24     | 02:00:00:00:01:01 |
| Router facing server | 198.51.100.1/24  | 02:00:00:00:02:01 |
| Server               | 198.51.100.20/24 | 02:00:00:00:02:20 |

Client port: 51514. Web service port: 80 for HTTP, 443 for HTTPS. There is no NAT. The switch's own MAC is not substituted into transit frames.

The laptop sends an off-subnet packet in an Ethernet frame addressed to its local gateway. The router removes that frame, decreases IPv4 TTL, updates the IP header checksum, and creates a frame using its outgoing MAC and the server's MAC. The endpoint IPs and TCP ports stay unchanged. On return, endpoint addresses and ports reverse; the response starts a fresh TTL of 64. The same router reduces it to 63.

## HTTP and HTTPS

The sample HTTP/1.1 request uses CRLF line endings and a blank line after headers. The response has a byte-counted Content-Length. Each illustrated message fits one TCP segment for clarity; real HTTP message boundaries and TCP segment boundaries need not align.

For HTTPS, the TLS 1.3 connection is already established. TLS authenticates and encrypts HTTP bytes before TCP carries them, and the destination authenticates and decrypts them before HTTP processing. The model does not perform real cryptography or compute TLS record lengths. The inspector represents encrypted application data symbolically.

IP/MAC addresses, TCP ports, and packet sizes are not hidden by TLS. HTTP methods, paths, headers, and bodies are protected. TLS record headers are not encrypted. There are no fake OSI session or presentation headers, and the physical layer adds signals rather than a header. OSI's upper-layer responsibilities are combined in actual Internet application stacks.

## Primary sources

- [RFC 9112 — HTTP/1.1 message syntax](https://www.rfc-editor.org/rfc/rfc9112.html#section-2.1)
- [RFC 9110 — HTTP and HTTPS URI schemes](https://www.rfc-editor.org/rfc/rfc9110.html#section-4.2)
- [RFC 8446 — TLS 1.3 records and protection](https://www.rfc-editor.org/rfc/rfc8446.html#section-5)
- [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html#section-3)
- [RFC 894 — IPv4 over Ethernet](https://www.rfc-editor.org/rfc/rfc894.html)
- [RFC 1812 — IPv4 router forwarding and TTL](https://www.rfc-editor.org/rfc/rfc1812.html#section-5.2.1)
- [RFC 4188 — Bridge forwarding tables](https://www.rfc-editor.org/rfc/rfc4188.html)
- [RFC 6272 — OSI and Internet architecture](https://www.rfc-editor.org/rfc/rfc6272.html#section-2.1.1)
- [RFC 5737 — Documentation-only IPv4 ranges](https://www.rfc-editor.org/rfc/rfc5737.html)
