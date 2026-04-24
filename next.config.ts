import type { NextConfig } from "next";

// 生产构建时通过 BASE_PATH 控制子路径部署（如 lincifeng.com/efficiency）。
// 本地开发默认留空，保持 http://localhost:3000 访问。
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export", // 纯静态导出，可直接丢到任何静态托管
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
