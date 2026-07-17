const nextConfig = {
  transpilePackages: ["@repo/backend"],
  turbopack: {
    resolveAlias: {
      "zod/v4/core": "./node_modules/zod/v4/core/index.js",
    },
  },
};

export default nextConfig;
