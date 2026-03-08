// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormFlow — Pro Form Builder",
  description: "Build, publish, and analyze forms with full theme control.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Bebas+Neue&family=Poppins:wght@400;600;700&family=Lato:wght@400;700&family=Raleway:wght@400;600;700&family=Nunito:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=DM+Sans:wght@400;500;700&family=Josefin+Sans:wght@400;600;700&family=Cormorant+Garamond:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
         <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
