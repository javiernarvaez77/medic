import { useUserRole } from "@/hooks/useDoctorData";
import PatientDashboard from "@/pages/PatientDashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";

const Index = () => {
  const { data: role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role === "doctor") {
    return <DoctorDashboard />;
  }

  return <PatientDashboard />;
};

export default Index;
