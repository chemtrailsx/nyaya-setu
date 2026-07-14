import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The legal corpus is read from disk at runtime, so it must be traced into
  // the serverless function bundle on Vercel (it lives outside the app dir).
  outputFileTracingIncludes: {
    "/api/case": ["./data/corpus/*.json"],
  },
};

export default nextConfig;
