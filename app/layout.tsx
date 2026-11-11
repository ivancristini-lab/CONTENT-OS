import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CONTENT OS",
  description: "Capturá un momento y convertilo en publicaciones listas para usar.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
