// app/page.tsx
import dynamic from "next/dynamic";
import { DataProvider } from "@/contexts/data-context";
import Tutorial from "@/components/tutorial";

const MainContent = dynamic(() => import("./MainContent"), { ssr: false });

export default function HomePage() {
  return (
    <DataProvider>
      <MainContent />
      <Tutorial />
    </DataProvider>
  );
}
