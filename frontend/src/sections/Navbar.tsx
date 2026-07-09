import React from "react";
import styles from "../sass/Navbar.module.scss";
import NavItems from "../components/NavItems";
// import StaggeredBlurTextEffect from "../Effects/StaggeredBlurTextEffect";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthContext } from "../context/authContext";
import { ModeToggle } from "@/components/ThemeBtn";
import { useTheme } from "@/context/ThemeProvider";
import DashboardIcon from "@/Icons/DashboardIcon";
import AvatarComponent from "@/components/AvatarComponent";
import Logo from "@/components/Logo";

interface NavbarProps {
  isUserLoggedIn: boolean;
}
const Navbar: React.FC<NavbarProps> = ({ isUserLoggedIn }) => {
  const [isOpen, isSetOpen] = React.useState<boolean>(false);
  const {userData} = useAuthContext();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSignupClick = () => {
    navigate("/signup");
  };
  const handleLoginClick = () => {
    navigate("/login");
  };
  const toggleMenu = () => {
    isSetOpen((prevIsOpen) => !prevIsOpen);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex xl:flex-row flex-col justify-between xl:pt-4 xl:pb-1 py-2 sm:py-4 items-center font-noto-sans xl:gap-20 md:gap-5 gap-2">
        <div className="flex justify-between items-center font-noto-sans relative w-full sm:w-auto pr-12 sm:pr-0">
          <Logo theme={theme} className="w-32 sm:w-40 md:w-52 flex-shrink-0" />
          <button
            onClick={toggleMenu}
            className={`${styles["menu-btn"]} sm:hidden flex ${theme === 'dark' ? 'dark' : 'light'}`}
            aria-label="Toggle Menu"
          >
            <div
              className={`${styles["menu-btn__burger"]} ${isOpen ? styles.open : ""}`}
            ></div>
          </button>
        </div>
          <nav className={`sm:flex hidden font-bold`}>
            <NavItems />
          </nav>
          <div className="flex gap-2 sm:gap-4 items-center">
            {!isUserLoggedIn ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  className="hidden sm:block py-1.5 sm:py-2 px-3 sm:px-6 bg-black text-white dark:bg-white dark:text-black rounded-3xl font-semibold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all border-2 border-purple-500 text-xs sm:text-sm md:text-base"
                  onClick={handleSignupClick}
                >
                  Signup
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  className="py-1.5 sm:py-2 px-2 sm:px-6 bg-black text-white dark:bg-white dark:text-black rounded-3xl font-semibold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all border-2 border-purple-500 text-xs sm:text-sm md:text-base"
                  onClick={handleLoginClick}
                >
                  Login
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  className="hidden sm:flex py-1.5 sm:py-2 px-3 sm:px-6 bg-black text-white dark:bg-white dark:text-black rounded-3xl font-semibold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all gap-2 border-2 border-purple-500 text-xs sm:text-sm md:text-base"
                  onClick={() => navigate("/user/dashboard")}
                >
                  <span className="font-ubuntu">Dashboard</span>
                  {theme === "dark" ? (
                    <DashboardIcon fillColor="black" size={18} />
                  ) : (
                    <DashboardIcon fillColor="white" size={18} />
                  )}
                </motion.button>
                <AvatarComponent
                  avatarFallbackText={userData.avatarFallbackText}
                  imageUrl={userData.profileImageUrl}
                  firstName={userData.firstName}
                  lastName={userData.lastName}
                  username={userData.userName}
                  userRole={userData.role}
                />
              </>
            )}

            <div className="w-full rounded-3xl font-semibold shadow-md transition-all">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div className={`nav-sidebar overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <nav className="p-4 sm:p-5 text-center" onClick={toggleMenu}>
          <NavItems navListBgForSmallScreen="dark:bg-white/5 bg-black/5" />
          {!isUserLoggedIn && (
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-700">
              <motion.button
                whileTap={{ scale: 0.8 }}
                className="w-full py-3 px-6 bg-black text-white dark:bg-white dark:text-black rounded-3xl font-semibold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all border-2 border-purple-500"
                onClick={handleSignupClick}
              >
                Signup
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.8 }}
                className="w-full py-3 px-6 bg-black text-white dark:bg-white dark:text-black rounded-3xl font-semibold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all border-2 border-purple-500"
                onClick={handleLoginClick}
              >
                Login
              </motion.button>
            </div>
          )}
          {isUserLoggedIn && (
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-700">
              <motion.button
                whileTap={{ scale: 0.8 }}
                className="w-full py-3 px-6 bg-black text-white dark:bg-white dark:text-black rounded-3xl font-semibold shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all gap-2 border-2 border-purple-500"
                onClick={() => navigate("/user/dashboard")}
              >
                <span className="font-ubuntu">Dashboard</span>
                {theme === "dark" ? (
                  <DashboardIcon fillColor="black" size={20} />
                ) : (
                  <DashboardIcon fillColor="white" size={20} />
                )}
              </motion.button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default React.memo(Navbar);
