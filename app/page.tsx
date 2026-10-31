"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import MobileNav from "@/components/MobileNav";
import DashboardModule from "@/components/DashboardModule";
import TimetableSection from "@/components/TimetableSection";
import VenueBookingSection from "@/components/VenueBookingSection";
import SpectraEventsModule from "@/components/SpectraEventsModule";
import ReschedulingStudioModule from "@/components/ReschedulingStudioModule";
import ExamsModule from "@/components/ExamsModule";
import AiAssistantModule from "@/components/AiAssistantModule";
import AnalyticsConflictsModule from "@/components/AnalyticsConflictsModule";
import SettingsRolesModule from "@/components/SettingsRolesModule";

export default function Home() {
  const [activeTab, setActiveTabRaw] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const setActiveTab = (tab: string) => {
    setActiveTabRaw(tab);
    setSearchQuery(""); // the search box only filters the Timetable screen
  };
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
    fetch("/api/cit/reset", { method: "POST" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || result?.success === false) {
          throw new Error(result?.error || "Unable to reset demo data.");
        }
        window.alert("Demo data reset successfully.");
      })
      .catch((error) => {
        window.alert(error instanceof Error ? error.message : "Unable to reset demo data.");
      });
  };

  return (
    <div className="min-h-screen flex text-[var(--ink)]">
      {/* Sidebar Navigation (desktop / tablet) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          isDark={isDark}
          toggleTheme={toggleTheme}
          role={role}
          setRole={setRole}
          onReset={handleResetData}
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 px-4 sm:px-6 pb-28 md:pb-10 max-w-[1600px] w-full mx-auto space-y-6">
          {activeTab === "dashboard" && (
            <DashboardModule
              onNavigateTab={(tab) => setActiveTab(tab)}
              userRole={role}
              isDark={isDark}
            />
          )}

          {activeTab === "timetable" && (
            <TimetableSection
              isDark={isDark}
              searchQuery={searchQuery}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "venues" && <VenueBookingSection userRole={role} />}

          {activeTab === "spectra" && (
            <SpectraEventsModule
              onNavigateTab={(tab) => setActiveTab(tab)}
              userRole={role}
            />
          )}

          {activeTab === "changes" && <ReschedulingStudioModule />}

          {activeTab === "exams" && (
            <ExamsModule
              onNavigateTab={(tab) => setActiveTab(tab)}
              userRole={role}
              isDark={isDark}
            />
          )}

          {activeTab === "ai" && (
            <AiAssistantModule
              onNavigateTab={(tab) => setActiveTab(tab)}
              userRole={role}
              isDark={isDark}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsConflictsModule
              onNavigateTab={(tab) => setActiveTab(tab)}
              userRole={role}
              isDark={isDark}
            />
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

      {/* Bottom tab bar (mobile) */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
