import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['youtubei.js', '@distube/ytdl-core', 'youtube-transcript'],
};

export default nextConfig;
