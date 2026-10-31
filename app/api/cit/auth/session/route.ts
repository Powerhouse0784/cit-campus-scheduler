import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedSession,
  setSessionCookie,
  clearSessionCookie,
  DEMO_ACCOUNTS,
  authenticateUser,
  AuthSession,
} from "@/lib/auth-session";
import { apiError, readJsonBody } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    const isAuthenticated = session.role !== "student";
    return NextResponse.json({
      success: true,
      isAuthenticated,
      session,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve session.";
    return apiError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonBody<Record<string, any>>(req);
    if (!parsed.success) return parsed.response;
    const body = parsed.data || {};

    // A role name is never an authentication credential. Require a verified
    // email/password pair before issuing a signed session cookie.
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return apiError("Email and password are required. Use the login endpoint.", 400);
    }
    const session = authenticateUser(body.email, body.password);
    if (!session) return apiError("Invalid credentials provided.", 401);

    const res = NextResponse.json({
      success: true,
      message: `Authenticated as ${session.name}.`,
      session,
    });
    return setSessionCookie(res, session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to establish authenticated session.";
    return apiError(message, 500);
  }
}

export async function DELETE() {
  const res = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });
  return clearSessionCookie(res);
}
