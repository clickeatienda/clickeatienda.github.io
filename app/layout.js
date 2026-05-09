import "./globals.css";

export const metadata = {
  title: "Clickea Tienda | Panel de Control",
  description: "Centro de comando para la gestión automatizada de Clickea Tienda — Dropshipping Colombia",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
