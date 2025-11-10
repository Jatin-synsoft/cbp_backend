module.exports = {
  apps: [
    {
      name: "booking-platform-api",
      script: "dist/main.js", 
      watch: false,           
      instances: 1,           
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
