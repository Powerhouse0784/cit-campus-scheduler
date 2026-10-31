import { NextRequest } from "next/server";
import { handleDisruptionPost } from "@/lib/disruption-handler";

export async function POST(req: NextRequest) {
  return handleDisruptionPost(req);
}
