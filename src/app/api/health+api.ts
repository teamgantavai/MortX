import { handleHealthRequest } from '../../server/handlers/healthHandler';

export async function GET(request: Request): Promise<Response> {
  return handleHealthRequest(request);
}
