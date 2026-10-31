/**
 * Campus Booking & Schedule Storage Interface
 * 
 * Provides an architectural abstraction separating business logic
 * from physical persistence.
 * - Current Implementation: Local deterministic JSON persistence (`data/user_bookings.json` & `exports/schedule.json`).
 * - Production Implementation: PostgreSQL / Prisma ORM repository adapter.
 */

export interface PersistedBooking {
  request_id: string;
  title: string;
  requester: string;
  role: string;
  category: string;
  attendance: number;
  day: string;
  start_period: number;
  end_period: number;
  room_id: string;
  room_name?: string;
  status: "approved" | "pending" | "rejected" | "cancelled";
  reason: string;
  submitted_at: string;
  is_user_created?: boolean;
}

export interface IBookingStorageAdapter {
  listBookings(): Promise<PersistedBooking[]>;
  createBooking(booking: PersistedBooking): Promise<PersistedBooking>;
  updateBookingStatus(
    requestId: string,
    status: "approved" | "pending" | "rejected" | "cancelled",
    reason: string
  ): Promise<boolean>;
  findBookingById(requestId: string): Promise<PersistedBooking | null>;
}
