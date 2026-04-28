import { motion } from "framer-motion";

interface MedCardProps {
  time: string;
  name: string;
  dose: string;
  taken: boolean;
  pending: boolean;
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const MedCard = ({ time, name, dose, taken, pending }: MedCardProps) => {
  return (
    <motion.div
      variants={item}
      className={`bg-card border border-border rounded-3xl p-6 flex items-center justify-between shadow-card transition-all ${
        pending ? "border-l-[6px] border-l-warning" : ""
      } ${taken ? "opacity-80" : ""}`}
    >
      <div>
        <p className={`text-lg font-bold mb-1 ${taken ? "text-muted-foreground" : "text-primary"}`}>
          {time}
        </p>
        <p className="text-xl font-bold text-foreground">
          {name} {dose}
        </p>
      </div>
      {taken ? (
        <span className="px-4 py-2.5 rounded-xl text-lg font-bold bg-success/10 text-success flex items-center gap-2">
          ✓ Listo
        </span>
      ) : pending ? (
        <span className="px-4 py-2.5 rounded-xl text-lg font-bold bg-warning/10 text-warning flex items-center gap-2">
          En espera
        </span>
      ) : null}
    </motion.div>
  );
};

export default MedCard;
