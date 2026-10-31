import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession, setSessionCookie, KNOWN_USERS, AuthSession, UserRole } from "@/lib/auth-session";
import { apiError, readJsonBody } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    return NextResponse.json({
      success: true,
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

    const targetKey = body.identity === "spectra_core" ? "spectra_core" : (body.role as string);
    const matchedUser = KNOWN_USERS[targetKey];

    let session: AuthSession;
    if (matchedUser) {
      session = { ...matchedUser };
    } else {
      const validRoles: UserRole[] = ["admin", "department_coordinator", "faculty", "club"];
      const role: UserRole = validRoles.includes(body.role) ? body.role : "club";
      session = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        email: body.email || `${role}@cit.edu`,
        name: body.name || (role === "admin" ? "Dean's Office" : role === "department_coordinator" ? "Department Coordinator" : "Campus User"),
        role,
        department: body.department,
        isSimulatedSelf: body.isSimulatedSelf === true,
      };
    }

    const res = NextResponse.json({
      success: true,
      message: `Authenticated as ${session.name} (${session.role}).`,
      session,
    });

    return setSessionCookie(res, session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update authentication session.";
    return apiError(message, 500);
  }
}
