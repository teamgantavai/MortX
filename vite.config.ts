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
              const body = JSON.parse(bodyStr || '{}');
              const { defaultQueryRouter } = await server.ssrLoadModule('./src/server/ai/queryRouter.ts');
              const { defaultRetrievalService } = await server.ssrLoadModule('./src/server/retrieval/retrievalService.ts');
              const { aiAnswerService } = await server.ssrLoadModule('./src/server/answer/answerService.ts');
              const structuredQuery = await defaultQueryRouter.routeQuery({
                query: body.query,
                location: body.location,
                userLocation: body.userLocation,
              });
              const retrieval = await defaultRetrievalService.retrieve(structuredQuery);
              const answerOutput = await aiAnswerService.generateAnswer({
                originalQuery: body.query,
                structuredQuery,
                results: retrieval.items,
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                answer: {
                  text: answerOutput.answer,
                  highlights: answerOutput.highlights,
                  sources: answerOutput.sources,
                  confidence: answerOutput.confidence,
                },
                query: structuredQuery,
                results: retrieval.items,
                metadata: {
                  resultCount: retrieval.items.length,
                  latencyMs: answerOutput.metadata.latencyMs,
                  warnings: answerOutput.warnings,
                }
              }));
            } catch (err: any) {
              res.statusCode = 400;
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

