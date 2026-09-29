import { handleQueryRequest } from '../../../server/handlers/queryHandler';
import { ensureServerStarted } from '../../../server/startup';

export async function POST(request: Request): Promise<Response> {
  console.log('[query+api.ts] Received POST request');
  ensureServerStarted();
  const res = await handleQueryRequest(request);
  console.log('[query+api.ts] Response status:', res.status);
  return res;
}
