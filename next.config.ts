import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['pdf-parse', '@langchain/community', 'langchain'],
    },
};

export default nextConfig;