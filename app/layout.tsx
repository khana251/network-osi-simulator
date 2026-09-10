import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Packet Lab — Interactive OSI Simulator',
  description:
    'Follow HTTP and HTTPS requests through the OSI model. Inspect packets, explore each network hop, and learn how TLS protects your data.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
