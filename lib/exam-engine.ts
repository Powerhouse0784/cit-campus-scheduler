import { Exam, ExamAssignment, ExamDay, ExamSession, Room } from "./types";

const EXAM_DAYS: ExamDay[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const EXAM_SESSIONS: ExamSession[] = ["AM", "PM"];

export class ExamEngine {
  private exams: Exam[];
  private rooms: Room[];

  constructor(dataset: any) {
    this.exams = dataset.exams;
    this.rooms = dataset.rooms.filter((r: Room) => r.allowed_uses.includes("exam"));
  }

  public scheduleExams(): ExamAssignment[] {
    const assignments: ExamAssignment[] = [];
    const grpSlotOcc = new Set<string>(); // "group:day:session"
    const roomSlotOcc = new Set<string>(); // "room:day:session"

    // Sort exams: biggest student size first
    const sorted = [...this.exams].sort((a, b) => b.size - a.size);

    for (const ex of sorted) {
      let placed = false;

      for (const day of EXAM_DAYS) {
        for (const sess of EXAM_SESSIONS) {
          // Check if any group already has an exam in this slot
          const groupClash = ex.groups.some((g) => grpSlotOcc.has(`${g}:${day}:${sess}`));
          if (groupClash) continue;

          // Pick rooms until sum(capacity // 2) >= ex.size
          const assignedRooms: string[] = [];
          let currentSeats = 0;

          // Sort rooms by descending capacity
          const availableRooms = this.rooms
            .filter((r) => !roomSlotOcc.has(`${r.id}:${day}:${sess}`))
            .sort((a, b) => b.capacity - a.capacity);

          for (const r of availableRooms) {
            assignedRooms.push(r.id);
            currentSeats += Math.floor(r.capacity / 2);
            if (currentSeats >= ex.size) break;
          }

          if (currentSeats >= ex.size) {
            // Commit
            for (const g of ex.groups) {
              grpSlotOcc.add(`${g}:${day}:${sess}`);
            }
            for (const rid of assignedRooms) {
              roomSlotOcc.add(`${rid}:${day}:${sess}`);
            }
            assignments.push({
              exam_id: ex.id,
              day,
              session: sess,
              rooms: assignedRooms,
            });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }

    return assignments;
  }
}