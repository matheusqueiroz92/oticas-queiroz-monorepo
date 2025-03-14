module.exports = {
  apps: [
    {
      name: "oticas-queiroz-backend",
      cwd: "/var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo/apps/backend",
      script: "dist/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3333,
        CORS_ORIGIN: "https://app.oticasqueiroz.com.br",
        API_URL: "https://app.oticasqueiroz.com.br",
      },
    },
    {
      name: "oticas-queiroz-frontend",
      cwd: "/var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo/apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_API_URL: "https://app.oticasqueiroz.com.br/api",
      },
    },
  ],
};
