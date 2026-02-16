"use client"

import {
  AboutSection,
  CtaSection,
  DatesSection,
  DocumentsSection,
  FooterSection,
  HeroSection,
  Navbar,
  type ImportantDates,
  WorkflowSection,
} from "@/components/public-landing"

export default function Landing() {
  const dates: ImportantDates = {
    opening: "1 Mars 2026",
    deadline: "30 Avril 2026",
    results: "Juin 2026",
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <WorkflowSection />
        <DocumentsSection />
        <DatesSection dates={dates} />
        <CtaSection />
      </main>
      <FooterSection />
    </div>
  )
}
