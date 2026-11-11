/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async redirects() {
    return [
      { source: "/leads", destination: "/admin/sales/leads", permanent: false },
      { source: "/leads/:id", destination: "/admin/sales/leads/:id", permanent: false },
      { source: "/pipeline", destination: "/admin/sales/pipeline", permanent: false },
      { source: "/activity", destination: "/admin/sales/activity", permanent: false },
      { source: "/analytics", destination: "/admin/sales/analytics", permanent: false },
      { source: "/settings", destination: "/admin/sales/settings", permanent: false },
      { source: "/employees", destination: "/admin/employees", permanent: false },
    ];
  },
  async headers() {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    let apiOrigin = "http://127.0.0.1:8000";
    try {
      apiOrigin = new URL(api).origin;
    } catch {
      apiOrigin = "http://127.0.0.1:8000";
    }
    const scriptSrc = process.env.NODE_ENV === "production" ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline' 'unsafe-eval'";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' blob: data:",
              `connect-src 'self' ${apiOrigin}`,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
