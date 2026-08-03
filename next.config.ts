import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Avoid double socket connections in development
  // Disable Turbopack since native bindings aren't available on this platform
  bundlePagesRouterDependencies: true,
};

export default nextConfig;
