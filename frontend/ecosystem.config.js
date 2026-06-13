// PM2 process config — run the Next.js standalone server directly on the host
// (outside Docker). The backend keeps running in Docker.
//
// One-time / per-deploy:
//   pnpm install --frozen-lockfile
//   pnpm run build:standalone     # build + copy static/public into standalone
//   pm2 start ecosystem.config.js # (or: pm2 reload ecosystem.config.js)
//   pm2 save                      # persist across reboots (after `pm2 startup`)
//
// NEXT_PUBLIC_* are inlined at build time from .env.production — edit that file
// and rebuild for changes to take effect (env vars below do NOT change them).

module.exports = {
  apps: [
    {
      name: 'bks-frontend',

      // The standalone bundle is self-contained. We run it from inside its own
      // directory so server.js resolves ./.next/static and ./public correctly.
      cwd: './.next/standalone',
      script: 'server.js',

      // Fork mode (NOT cluster): the Next.js standalone server.js binds its own
      // HTTP server and does not support PM2's shared-socket cluster mode
      // ("Failed to start server"). One process per instance, each on its own
      // PORT.
      //
      // Scale across CPU cores by raising `instances` and letting PM2 increment
      // PORT per process (3000, 3001, 3002…), then load-balance them with an
      // nginx upstream — see the snippet at the bottom of this file.
      exec_mode: 'fork',
      instances: 1,
      increment_var: 'PORT',

      env: {
        NODE_ENV: 'production',
        // Bind to loopback: a reverse proxy (nginx) on the same host should
        // terminate TLS and forward to 127.0.0.1:3000. Use 0.0.0.0 only if you
        // intentionally expose the port directly.
        HOSTNAME: '127.0.0.1',
        PORT: 3000,
      },

      // Resilience
      autorestart: true,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000,

      // Logs (timestamped, workers merged into one file pair under ~/.pm2/logs)
      time: true,
      merge_logs: true,
    },
  ],
}

// ─── Scaling across CPU cores ────────────────────────────────────────────────
// Set `instances: 4` (or however many cores you want to use). With
// increment_var: 'PORT', PM2 runs them on 3000, 3001, 3002, 3003. Point nginx
// (the app.example.com vhost) at an upstream pool instead of a single port:
//
//   upstream nextjs_app {
//       server 127.0.0.1:3000;
//       server 127.0.0.1:3001;
//       server 127.0.0.1:3002;
//       server 127.0.0.1:3003;
//       keepalive 32;
//   }
//   # then in the app server block:  proxy_pass http://nextjs_app;

