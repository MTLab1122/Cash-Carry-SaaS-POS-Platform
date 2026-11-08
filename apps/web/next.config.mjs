/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cash-carry/shared'],
  ...(isExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
        basePath: process.env.BASE_PATH || '',
        assetPrefix: process.env.BASE_PATH || '',
      }
    : {}),
};

export default nextConfig;
