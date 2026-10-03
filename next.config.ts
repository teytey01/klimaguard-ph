import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The chat route reads the markdown knowledge base from disk at runtime,
  // so make sure those files ship with the serverless function (Vercel).
  outputFileTracingIncludes: {
    "/api/chat": ["./knowledgeFiles/**/*.md", "./src/lib/agent/knowledge/**/*.md"],
  },
};

export default nextConfig;
