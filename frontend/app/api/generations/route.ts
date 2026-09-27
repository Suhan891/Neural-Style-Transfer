import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export function GET(request: Request) {
  return forwardAuthenticatedRequest(request, "/user/access");
}