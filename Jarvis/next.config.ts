import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ['pdf-parse', '@langchain/community', 'langchain'],
};

export default nextConfig;