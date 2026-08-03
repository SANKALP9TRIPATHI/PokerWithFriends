import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vasu-Juari Poker — Play Texas Hold\'em with Friends',
  description: 'A browser-based Texas Hold\'em poker platform. Create private rooms and play with friends in real time — no accounts, no downloads.',
  keywords: ['poker', 'texas holdem', 'multiplayer', 'card game', 'friends', 'real-time'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0a0e17" />
      </head>
      <body>{children}</body>
    </html>
  );
}
