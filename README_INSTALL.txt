CIT Timetable screen - matches the Smart Timetable UI reference (light, dark, desktop, mobile)

Run:
  npm install
  npm run dev        (then open http://localhost:3000 and click "Timetable")

Changed files in this update:
  components/TimetableSection.tsx   rebuilt: hero, view pills, week picker, P1-P9 grid with lunch strip,
                                    merged lab cells, Quick Info panel, Spectra card, mobile day view
  components/HeroBanner.tsx         now the campus-photo banner (light/dark image)
  components/Sidebar.tsx            added Timetable + Venue Booking, "Changes" label, order matches the UI
  components/MobileNav.tsx          bottom bar is now Home / Timetable / Booking / More
  components/TopNavbar.tsx          timetable search placeholder + controlled search
  app/page.tsx                      passes isDark / search / navigation into the Timetable screen
  app/globals.css                   course chip colour tokens (light + dark)
  lib/cit-backend.ts                getUtilisation() (real room-hour stats) + department on each cell
  app/api/cit/timetable/route.ts    returns { grid, metadata, stats }

Earlier notes: Exams / Settings / Analytics / AI screens are unchanged.
