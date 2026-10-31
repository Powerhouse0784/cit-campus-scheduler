CIT Analytics & Conflicts screen - drop-in files
Copy over your project root, accepting overwrites:
  components/AnalyticsConflictsModule.tsx (NEW)
  components/TopNavbar.tsx  (adds the analytics search placeholder; also contains the Settings one)
  app/page.tsx              (passes isDark to the analytics module)
  app/globals.css           (adds the .kpi-rose card style)
These build on the previous Settings update (Sidebar/CitLogo/MobileNav/SettingsRolesModule) - install that first if you haven't.
