import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { BRAND } from "@/lib/brand";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata = {
  title: "VectoRise | Operations Dashboard",
  description: `${BRAND.name} lead operations and activity dashboard`,
  icons: { icon: "/vectorise-logo.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">{children}</main>
            <footer className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted)] md:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{BRAND.name}</span>
                <div className="flex items-center gap-4">
                  <a href={`mailto:${BRAND.email}`} className="text-link">
                    {BRAND.email}
                  </a>
                  <a href={BRAND.site} target="_blank" rel="noopener noreferrer" className="text-link">
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
