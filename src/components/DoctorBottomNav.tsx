import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { to: "/", icon: Home, label: "Inicio" },
  { to: "/pacientes", icon: Users, label: "Pacientes" },
  { to: "/agenda", icon: Calendar, label: "Agenda" },
  { to: "/perfil", icon: User, label: "Perfil" },
];

const DoctorBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeDoctorTab"
                    className="absolute -inset-2 bg-accent rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`relative z-10 w-5 h-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default DoctorBottomNav;
