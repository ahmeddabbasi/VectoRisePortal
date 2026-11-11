import "./globals.css";
import { Plus_Jakarta_Sans, Space_Mono, Syne } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ScrollProgress } from "@/components/ScrollProgress";
import { BRAND } from "@/lib/brand";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata = {
  title: "VectoRise | Workforce Portal",
  description: `${BRAND.name} employee workforce and HRM portal`,
  icons: { icon: "/v-logo.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${syne.variable} ${spaceMono.variable} font-sans antialiased`}>
        <ScrollProgress />
        <AppProviders>
          <div className="min-h-screen bg-[#eef4fb]">
            <NavigationProgress />
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
