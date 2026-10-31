import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, ...(details === undefined ? {} : { details }) },
    { status },
  );
}

/** Parse JSON safely and return a consistent 400 response for malformed bodies. */
export async function readJsonBody<T = unknown>(request: Request): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse }
> {
  try {
    return { success: true, data: (await request.json()) as T };
  } catch {
    return { success: false, response: apiError("Request body must contain valid JSON.", 400) };
  }
}
