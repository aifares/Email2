import './globals.css';

import FlyonuiScript from '../components/FlyonuiScript';
import NavBar from '../components/NavBar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-base-200">
        <NavBar />
        <div className="p-6">{children}</div>
      </body>
      <FlyonuiScript />
    </html>
  );
}