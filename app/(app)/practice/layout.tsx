import { PracticeProvider } from "@/lib/PracticeContext";

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return <PracticeProvider>{children}</PracticeProvider>;
}
