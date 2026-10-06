import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "NIRMAN | Industrial Approval & Compliance",
  description:
    "From Business Idea to Compliant Operations — Faster, Simpler, Smarter. SIH 2026 demonstration.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
