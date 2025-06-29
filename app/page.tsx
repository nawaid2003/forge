// app/page.tsx
"use client";

import { DataProvider } from "@/contexts/data-context";
import MainContent from "./MainContent";
import Tutorial from "@/components/tutorial";

export default function HomePage() {
  return (
    <DataProvider>
      <MainContent />
      <Tutorial />
    </DataProvider>
  );
}
