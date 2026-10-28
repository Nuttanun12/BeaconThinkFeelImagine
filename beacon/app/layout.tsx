import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Beacon — Solar Microgrid Operations",
    template: "%s | Beacon",
  },
  description:
    "Real-time operations management for off-grid solar microgrids. Track check-ins, meter readings and village status across your network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
