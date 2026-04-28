import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Stethoscope, UserRound } from "lucide-react";
import kronicLogo from "@/assets/logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type AuthMode = "login" | "register" | "forgot";
type RoleOption = "patient" | "doctor";

const Auth = () => {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<RoleOption>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: form.fullName,
              phone: form.phone,
              role: role,
            },
          },
        });

        if (error) throw error;

        // Supabase returns user with empty identities for already registered emails
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          toast.error("Este correo ya está registrado", {
            description: "Intenta iniciar sesión o usa otro correo electrónico.",
          });
          setMode("login");
          return;
        }

        toast.success("¡Registro exitoso!", {
          description: "Revisa tu correo electrónico para verificar tu cuenta.",
        });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: window.location.origin,
        });

        if (error) throw error;

        toast.success("Correo enviado", {
          description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
        });
        setMode("login");
      } else {
        // Check if input looks like a document ID (no @ sign) → convert to internal email
        let loginEmail = form.email;
        if (!loginEmail.includes("@")) {
          loginEmail = `patient_${loginEmail}@kronic.internal`;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: form.password,
        });

        if (error) throw error;

        toast.success("¡Bienvenido de vuelta!");
      }
    } catch (error: any) {
      toast.error(error.message || "Ha ocurrido un error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-3">
          <img src={kronicLogo} alt="Kronic" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">KRONIC</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión integral de salud crónica</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-card-md"
      >
        {/* Mode Tabs */}
        {mode !== "forgot" && (
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Iniciar Sesión" : "Registrarse"}
              </button>
            ))}
          </div>
        )}
        {mode === "forgot" && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">Recuperar contraseña</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
        )}

        {/* Role Selector (register only) */}
        {mode === "register" && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Tipo de cuenta
            </p>
            <div className="flex gap-2">
              {([
                { key: "patient" as const, label: "Paciente", icon: UserRound },
                { key: "doctor" as const, label: "Profesional de la Salud", icon: Stethoscope },
              ]).map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    role === r.key
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  <r.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              {/* Full Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    placeholder="Carlos Mendoza"
                    className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="+57 301 234 5678"
                    className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email or Document ID */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {mode === "login" ? "Correo electrónico o Cédula" : "Correo electrónico"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={mode === "login" ? "text" : "email"}
                required
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder={mode === "login" ? "correo@ejemplo.com o 1234567890" : "correo@ejemplo.com"}
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            {mode === "login" && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Pacientes sin correo: usa tu número de cédula
              </p>
            )}
          </div>

          {/* Password */}
          {mode !== "forgot" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-12 py-3 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary font-medium mt-1.5 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-card-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Iniciar Sesión" : mode === "register" ? "Crear Cuenta" : "Enviar enlace"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-5">
          {mode === "forgot" ? (
            <>
              <button
                onClick={() => setMode("login")}
                className="text-primary font-semibold"
              >
                Volver a Iniciar Sesión
              </button>
            </>
          ) : (
            <>
              {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary font-semibold"
              >
                {mode === "login" ? "Regístrate" : "Inicia Sesión"}
              </button>
            </>
          )}
        </p>
      </motion.div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-xs">
        Al registrarte aceptas nuestros términos de servicio y política de privacidad.
      </p>
    </div>
  );
};

export default Auth;
