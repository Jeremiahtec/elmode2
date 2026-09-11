// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELMODE — Vehicle Diagnostic & Telemetry Monitoring",
  description: "Real-time vehicle telemetry ingestion and diagnostic reasoning platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-graphite-900 font-sans text-graphite-100 antialiased">{children}</body>
    </html>
  );
}
