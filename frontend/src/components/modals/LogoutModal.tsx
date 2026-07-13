import { userLogout } from "@/lib/getLocalStorage";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import WarningIcon from "@/Icons/WarningIcon";
import { SuccessToast } from "@/lib/toasts";
import { useAuthContext } from "@/context/authContext";

const LogoutModal = () => {
  const navigate = useNavigate();
  const {setIsLoggedIn} = useAuthContext();
  
  const handleConfirmLogout = () => {
    userLogout();
    setIsLoggedIn(false);
    navigate("/");
    SuccessToast("Logout Successful");
  };
  
  const handleCancelLogout = () => {
    navigate(-1);
  };

  const modalVariants = {
    hidden: { opacity: 0.3, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  return (
    <section className="w-full h-screen fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/85 backdrop-blur-md transition-opacity duration-300 z-[9999]">
        <motion.div
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <WarningIcon fillColor="rgb(234, 179, 8)" />
            <h2 className="text-xl font-bold font-ubuntu dark:text-white text-gray-900">Confirm Logout</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 font-ubuntu text-sm">
            Are you sure you want to logout? You will need to sign in again to access your dashboard.
          </p>
          <div className="flex gap-3 justify-end">
            <button 
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-black-200 px-5 py-2.5 rounded-xl transition duration-200 font-ubuntu font-medium text-sm border border-gray-200 dark:border-gray-800" 
              onClick={handleCancelLogout}
            >
              Cancel
            </button>
            <button 
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/10 transition duration-200 font-ubuntu font-medium text-sm" 
              onClick={handleConfirmLogout}
            >
              Logout
            </button>
          </div>
        </motion.div>
    </section>
  );
};

export default LogoutModal;
