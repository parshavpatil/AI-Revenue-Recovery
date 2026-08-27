import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RecoverAI Voice',
  description: 'Payment failure recovery and Hinglish voice recovery platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
