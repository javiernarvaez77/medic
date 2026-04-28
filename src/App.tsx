import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Index from "./pages/Index";
import Medications from "./pages/Medications";
import Appointments from "./pages/Appointments";
import Labs from "./pages/Labs";
import Profile from "./pages/Profile";
import DoctorPatients from "./pages/DoctorPatients";
import DoctorAgenda from "./pages/DoctorAgenda";
import DoctorReports from "./pages/DoctorReports";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/medicamentos" element={<Medications />} />
                      <Route path="/citas" element={<Appointments />} />
                      <Route path="/laboratorios" element={<Labs />} />
                      <Route path="/pacientes" element={<DoctorPatients />} />
                      <Route path="/agenda" element={<DoctorAgenda />} />
                      <Route path="/reportes" element={<DoctorReports />} />
                      <Route path="/perfil" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
