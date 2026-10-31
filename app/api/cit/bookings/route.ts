import { NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";

export async function GET() {
  const bookings = citBackend.getSpectraBookings();
  return NextResponse.json({ bookings });
}