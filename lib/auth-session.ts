import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export type UserRole = "admin" | "department_coordinator" | "faculty" | "club" | "student";

export interface AuthSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  facultyId?: string;
  isSimulatedSelf?: boolean;
  loginTime: number;
}

export interface UserAccount {
  email: string;
  passwordHash: string; // Plaintext demo password verified via timingSafeEqual
  session: Omit<AuthSession, "loginTime">;
}

export const DEMO_ACCOUNTS: Record<string, UserAccount> = {
  "admin@cit.edu": {
    email: "admin@cit.edu",
    passwordHash: "CITAdmin2024!",
    session: {
      id: "usr-admin-01",
      email: "admin@cit.edu",
      name: "Dean's Office (Academic Admin)",
      role: "admin",
      department: "Administration",
    },
  },
  "coordinator@cit.edu": {
    email: "coordinator@cit.edu",
    passwordHash: "CITCoord2024!",
    session: {
      id: "usr-coord-01",
      email: "coordinator@cit.edu",
      name: "Dr. Ramesh (ECE Coordinator)",
      role: "department_coordinator",
      department: "ECE",
    },
  },
  "faculty@cit.edu": {
    email: "faculty@cit.edu",
    passwordHash: "CITFaculty2024!",
    session: {
      id: "usr-fac-01",
      email: "faculty@cit.edu",
      name: "Dr. Amit Behera (Faculty)",
      role: "faculty",
      department: "Computer Science",
      facultyId: "F01",
    },
  },
  "clubrep@cit.edu": {
    email: "clubrep@cit.edu",
    passwordHash: "CITClub2024!",
    session: {
      id: "usr-club-01",
      email: "clubrep@cit.edu",
      name: "Aarav Sharma (Club Representative)",
      role: "club",
      department: "Cultural Club",
    },
  },
};

export const AUTH_COOKIE_NAME = "cit_auth_token";
function getSigningSecret(): string {
  const configured = process.env.CIT_AUTH_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV !== "production") {
    return "local-development-only-secret-change-before-deploy-2026";
  }
  throw new Error("CIT_AUTH_SECRET must be configured to a random value of at least 32 characters in production.");
}

/**
 * Creates an HMAC-SHA256 signature for the session payload to prevent tampering.
 */
export function signSession(session: AuthSession): string {
  const jsonStr = JSON.stringify(session);
  const b64 = Buffer.from(jsonStr).toString("base64url");
  const hmac = crypto.createHmac("sha256", getSigningSecret()).update(b64).digest("hex");
  return `${b64}.${hmac}`;
}

/**
 * Cryptographically validates the signed token. Returns null if invalid or tampered with.
 */
export function verifySignedToken(token: string): AuthSession | null {
  if (!token || !token.includes(".")) return null;
  const [b64, signature] = token.split(".");
  if (!b64 || !signature) return null;

  let expectedHmac: string;
  try { expectedHmac = crypto.createHmac("sha256", getSigningSecret()).update(b64).digest("hex"); } catch { return null; }
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedHmac);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null; // Tampered or invalid signature
  }

  try {
    const raw = Buffer.from(b64, "base64url").toString("utf-8");
    const session = JSON.parse(raw);
    if (!session || !session.id || !session.email || !session.name ||
      !["admin", "department_coordinator", "faculty", "club", "student"].includes(session.role) ||
      typeof session.loginTime !== "number" ||
      session.loginTime > Date.now() + 60_000 ||
      Date.now() - session.loginTime > 7 * 24 * 60 * 60 * 1000) return null;
    return session as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Authenticates user credentials. Returns an AuthSession or null.
 */
export function authenticateUser(email: string, password: string): AuthSession | null {
  const account = DEMO_ACCOUNTS[email.trim().toLowerCase()];
  if (!account) return null;

  const passBuf = Buffer.from(password);
  const expectedBuf = Buffer.from(account.passwordHash);

  if (passBuf.length === expectedBuf.length && crypto.timingSafeEqual(passBuf, expectedBuf)) {
    return {
      ...account.session,
      loginTime: Date.now(),
    };
  }
  return null;
}

/**
 * Extracts and cryptographically verifies the logged-in user from the incoming request.
 * If unauthenticated or token is forged, safely falls back to a read-only Student/Guest session.
 */
export function getAuthenticatedSession(req: NextRequest): AuthSession {
  // 1. Check signed cookie
  const cookieVal = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieVal) {
    const session = verifySignedToken(cookieVal);
    if (session) return session;
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const session = verifySignedToken(token);
    if (session) return session;
  }

  // 3. Fallback: unauthenticated guest / student (strictly read-only permissions)
  return {
    id: "usr-guest-student",
    email: "student.guest@cit.edu",
    name: "Campus Guest / Student",
    role: "student",
    department: "General",
    loginTime: 0,
  };
}

/**
 * Helper to set the signed authentication cookie.
 */
export function setSessionCookie(res: NextResponse, session: AuthSession): NextResponse {
  const token = signSession(session);
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}

/**
 * Clears the authentication cookie.
 */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
