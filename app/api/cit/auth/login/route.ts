import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, setSessionCookie, DEMO_ACCOUNTS } from "@/lib/auth-session";
import { apiError, readJsonBody } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonBody<Record<string, any>>(req);
    if (!parsed.success) return parsed.response;
    const body = parsed.data || {};

    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString().trim();

    if (!email || !password) {
      return apiError("Email and password are required.", 400);
    }

    const session = authenticateUser(email, password);
    if (!session) {
      return apiError("Invalid credentials. Please use the demo credentials listed in the README or login dialog.", 401);
    }

    const res = NextResponse.json({
      success: true,
      message: `Successfully authenticated as ${session.name} (${session.role}).`,
      session,
    });

    return setSessionCookie(res, session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    return apiError(message, 500);
  }
}

export async function GET() {
  // Returns list of public demo accounts for easy hackathon evaluation (without showing raw passwords)
  const publicAccounts = Object.values(DEMO_ACCOUNTS).map((acc) => ({
    email: acc.email,
    name: acc.session.name,
    role: acc.session.role,
    department: acc.session.department,
  }));

  return NextResponse.json({
    success: true,
    demoAccounts: publicAccounts,
  });
}
