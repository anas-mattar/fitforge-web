import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this repository. Without it Turbopack walks up the tree and
  // picks up an unrelated lockfile from an ancestor directory, which makes the build depend
  // on what happens to sit outside the repo — see the nested layout in
  // ../docs/sdlc/repository-strategy.md.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
