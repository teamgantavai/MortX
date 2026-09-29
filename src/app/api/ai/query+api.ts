import { handleQueryRequest } from '../../../server/handlers/queryHandler';
import { ensureServerStarted } from '../../../server/startup';

export async function POST(request: Request): Promise<Response> {
  ensureServerStarted();
  return handleQueryRequest(request);
}
