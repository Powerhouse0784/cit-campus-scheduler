import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CIT Campus Scheduler | Smart Scheduling. A Better Campus.",
  description: "Official Campus Timetable, Midsem Exam Matrix, and Spectra Week Venue Manager for Chilika Institute of Technology.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}