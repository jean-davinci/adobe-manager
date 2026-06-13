import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Cabeceras de seguridad aplicadas a todas las respuestas. Hardening progresivo
// según el entorno (Next/Turbopack necesita 'unsafe-eval' para HMR en dev).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  },
  // HSTS solo en producción (no aplicar a localhost).
  ...(isProd
    ? [{
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      }]
    : []),
  {
    // CSP pragmática: permite Next (estilos/inline runtime) y los iframes/medios
    // que usan los módulos (Gmail embed, Drive preview, imágenes de WhatsApp).
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https:",
      "frame-src 'self' https://mail.google.com https://drive.google.com https://www.turnitin.com https://iverificate.com https://my.canvasacademic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
