module.exports = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.node = config.node || {};
      config.node.__dirname = false;
    }
    return config;
  },
};
