import { handleHealthRequest } from '../../server/handlers/healthHandler';
import { ensureServerStarted } from '../../server/startup';

export async function GET(request: Request): Promise<Response> {
  ensureServerStarted();
  return handleHealthRequest(request);
}
