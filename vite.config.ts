import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function aiQueryApiPlugin() {
  return {
    name: 'ai-query-api-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/api/ai/query' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk: any) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const { ensureServerStarted } = await server.ssrLoadModule('./src/server/startup.ts');
              ensureServerStarted();
              const { handleQueryRequest } = await server.ssrLoadModule('./src/server/handlers/queryHandler.ts');

              const protocol = req.headers['x-forwarded-proto'] || 'http';
              const host = req.headers.host || 'localhost:5173';
              const fullUrl = `${protocol}://${host}${req.url}`;

              const headers = new Headers();
              for (const [key, value] of Object.entries(req.headers)) {
                if (value) {
                  if (Array.isArray(value)) {
                    value.forEach((v: string) => headers.append(key, v));
                  } else {
                    headers.set(key, String(value));
                  }
                }
              }

              const webRequest = new Request(fullUrl, {
                method: req.method,
                headers,
                body: bodyStr,
              });

              const webResponse = await handleQueryRequest(webRequest);
              res.statusCode = webResponse.status;
              webResponse.headers.forEach((val: string, key: string) => {
                res.setHeader(key, val);
              });
              const resText = await webResponse.text();
              res.end(resText);
            } catch (err: any) {
              console.error('[Vite API Error]', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Error processing query' }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    aiQueryApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})

