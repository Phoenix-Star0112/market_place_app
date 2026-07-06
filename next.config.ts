import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["204.236.242.125"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
