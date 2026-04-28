import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import DoctorBottomNav from "./DoctorBottomNav";
import { useUserRole } from "@/hooks/useDoctorData";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { data: role } = useUserRole();

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className="pb-20">{children}</main>
      {role === "doctor" ? <DoctorBottomNav /> : <BottomNav />}
    </div>
  );
};

export default AppShell;
