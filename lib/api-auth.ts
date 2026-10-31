import { NextRequest, NextResponse } from "next/server";
import { AuthSession, getAuthenticatedSession, UserRole } from "@/lib/auth-session";

export type RoleAuthorization =
  | { ok: true; session: AuthSession }
  | { ok: false; response: NextResponse };

/** Central role guard for every state-changing API route. */
export function authorizeRoles(req: NextRequest, allowed: UserRole[]): RoleAuthorization {
  const session = getAuthenticatedSession(req);
  if (!allowed.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden", message: "Your account is not allowed to perform this action." },
        { status: session.role === "student" ? 401 : 403 }
      ),
    };
  }
  return { ok: true, session };
}

export const ADMIN_ROLES: UserRole[] = ["admin"];
export const SCHEDULER_ROLES: UserRole[] = ["admin", "department_coordinator"];
