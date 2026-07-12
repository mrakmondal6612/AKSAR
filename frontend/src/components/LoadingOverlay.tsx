import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = "Please wait..." }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl"
        >
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 dark:text-purple-400 mb-3" />
          <motion.span 
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="text-purple-600 dark:text-purple-400 font-medium text-lg"
          >
            {message}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
