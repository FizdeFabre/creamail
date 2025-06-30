/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  experimental: {
    appDir: true, // 🔮 Active le App Router avec /app/layout.tsx etc.
  },
};

module.exports = nextConfig;