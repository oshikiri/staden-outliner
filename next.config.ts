import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

if (apiBaseUrl) {
  remotePatterns.push(new URL("/api/images", apiBaseUrl));
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  images: {
    localPatterns: [
      {
        pathname: "/api/images",
      },
    ],
    remotePatterns,
  },
};

export default nextConfig;
