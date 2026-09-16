import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    // Pino in proxy.ts owns request logs, avoiding duplicate development logs.
    incomingRequests: false,
  },
};

export default nextConfig;
