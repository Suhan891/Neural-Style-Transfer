import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export function POST(request: Request) {
  return forwardAuthenticatedRequest(request, "/agent/generate");
}