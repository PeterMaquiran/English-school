import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.73"],
  logging: {
    // Pino in proxy.ts owns request logs, avoiding duplicate development logs.
    incomingRequests: false,
  },
};

export default nextConfig;
