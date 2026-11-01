import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://cit-campus-scheduler.vercel.app"),
  title: "CIT Campus Scheduler | Smart Scheduling. A Better Campus.",
  description:
    "Official Operations Hub for Chilika Institute of Technology. 0-Hard Clash Timetables, Dynamic Midsem Exam Matrix, Spectra Tech Fest Venue Booking & Minimal-Movement Disruption Solver.",
  keywords: [
    "CIT Scheduler",
    "Campus Timetable",
    "Chilika Institute of Technology",
    "Crunch Week 2024",
    "Constraint Satisfaction",
    "Spectra Fest Booking",
  ],
  authors: [{ name: "CIT Master Minds" }],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "CIT Campus Scheduler | Smart Scheduling. A Better Campus.",
    description:
      "Chilika Institute of Technology's Crunch Week Operations Hub. Certified 0-hard-clash master timetable, dynamic midsem exams, and festival venue manager.",
    url: "https://cit-campus-scheduler.vercel.app",
    siteName: "CIT Campus Scheduler",
    images: [
      {
        url: "/images/hero-campus-light.jpg",
        width: 1200,
        height: 630,
        alt: "Chilika Institute of Technology Campus",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CIT Campus Scheduler | Chilika Institute of Technology",
    description:
      "Deterministic timetable solver with 0 clashes, social-distancing midsem exam planning, and plain-language Spectra venue booking.",
    images: ["/images/hero-campus-light.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}