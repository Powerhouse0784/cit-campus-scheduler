"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import DashboardModule from "@/components/DashboardModule";
import HeroBanner from "@/components/HeroBanner";
import TimetableSection from "@/components/TimetableSection";
import VenueBookingSection from "@/components/VenueBookingSection";
import SpectraEventsModule from "@/components/SpectraEventsModule";
import ReschedulingStudioModule from "@/components/ReschedulingStudioModule";
import ExamsModule from "@/components/ExamsModule";
import AiAssistantModule from "@/components/AiAssistantModule";
import AnalyticsConflictsModule from "@/components/AnalyticsConflictsModule";
import SettingsRolesModule from "@/components/SettingsRolesModule";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [role, setRole] = useState("admin");
  const [isDark, setIsDark] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setScheduleData(data))
      .catch((e) => console.error("Error fetching schedule:", e));
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);

    if (!isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const handleResetData = () => {
    alert(
      "Reset completed: Timetable and demo states restored to clean baseline."
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg)] text-[var(--ink)]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        onReset={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 p-5 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 overflow-y-auto">
        <TopNavbar isDark={isDark} toggleTheme={toggleTheme} role={role} />

        {/* Dashboard Overview */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <HeroBanner
              title="Good Morning, Ritik! 👋"
              subtitle="Welcome to CIT Campus Scheduler · Smart Scheduling. A Better Campus."
              eyebrow="Week 07 · Semester Overview"
              badge="0 Hard Conflicts"
              type="dashboard"
            />

            <DashboardModule
              onNavigateTab={(tab) => setActiveTab(tab)}
              userRole={role}
              isDark={isDark}
            />
          </div>
        )}

        {/* Timetable */}
        {activeTab === "timetable" && (
          <TimetableSection scheduleData={scheduleData} />
        )}

        {/* Venues */}
        {activeTab === "venues" && <VenueBookingSection />}

        {/* Spectra Events */}
        {activeTab === "spectra" && (
          <SpectraEventsModule
            onNavigateTab={(tab) => setActiveTab(tab)}
            userRole={role}
          />
        )}

        {/* Rescheduling Studio */}
        {activeTab === "changes" && <ReschedulingStudioModule />}

        {/* Exams */}
        {activeTab === "exams" && <ExamsModule />}

        {/* AI Assistant */}
        {activeTab === "ai" && (
          <AiAssistantModule
            onNavigateTab={(tab) => setActiveTab(tab)}
            userRole={role}
          />
        )}

        {/* Analytics & Conflicts */}
        {activeTab === "analytics" && (
          <AnalyticsConflictsModule
            onNavigateTab={(tab) => setActiveTab(tab)}
            userRole={role}
          />
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <SettingsRolesModule
            onNavigateTab={(tab) => setActiveTab(tab)}
            userRole={role}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        )}
      </main>
    </div>
  );
}