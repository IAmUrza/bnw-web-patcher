import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TitleScreen renders the SNES capture at quality 100 so the upscaled
    // pixel art doesn't get softened. Next 16 requires any non-default
    // quality to be declared here.
    qualities: [75, 100],

    // `images.domains` used to list ff6asc.vercel.app, from when images
    // were served from the deployed site. Everything is local under
    // public/ now, so no remote hosts are needed. If that changes, add
    // them as remotePatterns rather than domains, which is deprecated:
    // remotePatterns: [{ protocol: 'https', hostname: 'example.com' }],
  },
};

export default nextConfig;
