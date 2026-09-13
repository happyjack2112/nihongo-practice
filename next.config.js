/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdf-img-convert", "canvas"],
  },
};

module.exports = nextConfig;
