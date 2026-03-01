import { motion } from "framer-motion";

const BOOT_VARIANTS = {
  initial: { opacity: 0, scale: 0.98, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98 },
};

const BOOT_TRANSITION = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  duration: 0.2,
};

export interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  return (
    <motion.div
      variants={BOOT_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={BOOT_TRANSITION}
      className="boot-sequence"
    >
      {children}
    </motion.div>
  );
}
