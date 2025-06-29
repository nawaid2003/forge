import dynamic from "next/dynamic";

const ClientPage = dynamic(() => import("@/app/ClientPage"), { ssr: false });

export default function HomePage() {
  return <ClientPage />;
}
