// app/page.tsx
import dynamic from "next/dynamic";

const ClientPage = dynamic(() => import("./ClientPage"), { ssr: false });

export default function HomePage() {
  return <ClientPage />;
}
