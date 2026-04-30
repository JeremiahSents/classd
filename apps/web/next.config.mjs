/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["notely.localhost", "*.notely.localhost"],
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
