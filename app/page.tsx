"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import HeroBanner from "@/components/HeroBanner";
import TimetableSection from "@/components/TimetableSection";
import VenueBookingSection from "@/components/VenueBookingSection";

// Import the 6 showcase modules
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

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const handleResetData = () => {
    alert("Reset completed: Timetable and demo states restored to clean baseline.");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg)] text-[var(--ink)]">
      {/* Sidebar with Navigation Links */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        onReset={handleResetData}
      />

      {/* Main Content Area */}
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
            {/* Quick overview grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => setActiveTab("spectra")} className="cursor-pointer">
                <SpectraEventsModule />
              </div>
              <div onClick={() => setActiveTab("changes")} className="cursor-pointer">
                <ReschedulingStudioModule />
              </div>
            </div>
          </div>
        )}

        {/* Individual Modules */}
        {activeTab === "timetable" && (
          <TimetableSection scheduleData={null} />
        )}

        {activeTab === "venues" && (
          <VenueBookingSection />
        )}

        {activeTab === "spectra" && (
          <SpectraEventsModule onNavigateTab={(tab) => setActiveTab(tab)} userRole={role} />
        )}
        {activeTab === "changes" && (
          <ReschedulingStudioModule />
        )}

        {activeTab === "exams" && (
          <ExamsModule />
        )}

        {activeTab === "ai" && (
          <AiAssistantModule onNavigateTab={(tab) => setActiveTab(tab)} userRole={role} />
        )}

        {activeTab === "analytics" && (
          <AnalyticsConflictsModule onNavigateTab={(tab) => setActiveTab(tab)} userRole={role} />
        )}

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