import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Loader2, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const AddEmailSection = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Check if user has a real email (not kronic.internal)
  const currentEmail = user?.email ?? "";
  const hasRealEmail = currentEmail && !currentEmail.endsWith("@kronic.internal");
  const pendingEmail = user?.new_email;

  if (hasRealEmail && !pendingEmail) {
    // User already has a real email, no need to show this section
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa un correo electrónico válido");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: email.trim(),
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("¡Correo enviado!", {
        description: "Revisa tu bandeja de entrada para verificar tu correo.",
      });
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar correo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEmail("");
    setEmailSent(false);
  };

  return (
    <>
      {/* Banner/prompt to add email */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            {pendingEmail ? (
              <>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Verificación pendiente
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Se envió un enlace de verificación a <strong>{pendingEmail}</strong>. 
                  Revisa tu bandeja de entrada para completar el proceso.
                </p>
                <button
                  onClick={() => setIsOpen(true)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Usar otro correo
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Agrega tu correo electrónico
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Tu cuenta fue creada sin correo. Agrégalo para poder recuperar tu contraseña 
                  y recibir notificaciones importantes.
                </p>
                <button
                  onClick={() => setIsOpen(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                >
                  Agregar correo
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal for adding email */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Agregar Correo</h2>
                </div>
                <button onClick={handleClose} className="p-1 rounded-full hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {emailSent ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-success" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">¡Correo enviado!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Revisa tu bandeja de entrada en <strong>{email}</strong> y haz clic en el enlace 
                    para verificar tu correo electrónico.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Se enviará un correo de verificación. Una vez verificado, podrás usar este 
                      correo para recuperar tu contraseña.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Enviar verificación"
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
