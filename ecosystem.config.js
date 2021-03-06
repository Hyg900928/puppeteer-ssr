module.exports = {
  apps: [
    // First application
    {
      name: 'development',
      script: 'src/index.js',
      watch: true,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: 'production'
      },
      watch: [
        "src",
      ]
    }
  ]
};
