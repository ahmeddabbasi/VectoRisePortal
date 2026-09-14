import "./globals.css";
import { Plus_Jakarta_Sans, Space_Mono, Syne } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ScrollProgress } from "@/components/ScrollProgress";
import { Sidebar } from "@/components/Sidebar";
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
  title: "VectoRise | Operations Portal",
  description: `${BRAND.name} lead operations and activity portal`,
  icons: { icon: "/v-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${syne.variable} ${spaceMono.variable} font-sans antialiased`}>
        <ScrollProgress />
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <div className="relative flex min-w-0 flex-1 flex-col bg-[#eef4fb]">
            <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
            <main className="relative flex-1 overflow-x-hidden px-5 py-8 md:px-10 md:py-10 lg:px-12">
              <NavigationProgress />
              <AppProviders>{children}</AppProviders>
            </main>
            <footer className="relative border-t border-ink/10 bg-navy-deep px-5 py-6 text-paper md:px-10 lg:px-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono-custom text-[9px] uppercase tracking-widest text-paper/60">
                  © {new Date().getFullYear()} {BRAND.name}
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <a href={`mailto:${BRAND.email}`} className="font-mono-custom text-[9px] uppercase tracking-widest text-paper/75 hover:text-lime">
                    {BRAND.email}
                  </a>
                  <a
                    href={BRAND.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono-custom text-[9px] uppercase tracking-widest text-paper/75 hover:text-lime"
                  >
                    vectorise.dev
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
