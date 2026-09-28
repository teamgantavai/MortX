import { handleQueryRequest } from '../../../server/handlers/queryHandler';

export async function POST(request: Request): Promise<Response> {
  return handleQueryRequest(request);
}
