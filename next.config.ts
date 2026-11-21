import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The e2e suite builds into its own directory so it never collides with a
  // running `next dev` (which writes to .next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
