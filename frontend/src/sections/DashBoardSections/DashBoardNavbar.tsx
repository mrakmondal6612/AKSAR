import DashboardNavItem from "@/sections/DashBoardSections/DashboardNavItem";
import Logo from "@/components/Logo";
import { ModeToggle } from "@/components/ThemeBtn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DashBoardNavItems,
  DashBoardNavItems2,
  DashBoardNavItems3,
  DashBoardAdminNavItems,
  DashBoardInstructorNavItems,
} from "@/constants";
import { useAuthContext } from "@/context/authContext";
import { useTheme } from "@/context/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import Seperator from "@/components/Seperator";
import { useDashboardContext } from "@/context/dashboardContext";
import SidebarOpenIcon from "@/Icons/SidebarOpenIcon";
import SidebarCloseIcon from "@/Icons/SidebarCloseIcon";
import { BookAIcon } from "lucide-react";
import React from "react";
import LogoutIcon from "@/Icons/LogoutIcon";

const DashBoardNavbar: React.FC = () => {
  const { isSideBarOpen, setIsSideBarOpen } = useDashboardContext();
  const [isAccordionOpen, setIsAccordionOpen] = React.useState<boolean>(false);
  const location = useLocation();
  const { theme } = useTheme();
  const { userData } = useAuthContext();
  const locName = location.pathname.split("/")[2];

  return (
      <aside
      className={`bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-2xl border-r border-gray-200 dark:border-gray-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] dark:text-white text-black 
        transition-all duration-300 fixed top-0 left-0 z-10 h-screen overflow-x-hidden hide-scrollbar
        ${isSideBarOpen ? "sm:w-72 w-full" : "w-16"}`}
      >
        <div
          className={`flex flex-col min-h-full ${
            isSideBarOpen
              ? "py-2 px-5 justify-between"
              : "py-4 justify-between items-center"
          } ${userData.role === "ADMIN" ? "space-y-1" : "space-y-4"}`}
        >
          <div className="flex flex-col w-full space-y-2 relative">
            <div className="flex justify-between items-center py-2 w-full">
              {isSideBarOpen && (
                <Logo theme={theme} className="object-contain w-34" />
              )}
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setIsSideBarOpen(!isSideBarOpen)}
                className={`animate-pulse flex justify-center items-center ${
                  isSideBarOpen ? "w-[25%]" : "w-full"
                }`}
              >
                {isSideBarOpen ? (
                  <SidebarCloseIcon
                    fillColor={theme === "dark" ? "white" : "black"}
                    size={32}
                  />
                ) : (
                  <SidebarOpenIcon
                    fillColor={theme === "dark" ? "white" : "black"}
                    size={32}
                  />
                )}
              </motion.button>
            </div>

            <div className="border-t-2 dark:border-white border-black rounded-l-2xl rounded-r-2xl py-2 w-full px-2"></div>
            <nav
              className={`space-y-0 w-full ${
                isSideBarOpen ? "px-0" : "px-1"
              }`}
            >
              {DashBoardNavItems.map((item, index) => (
                <DashboardNavItem
                  key={index}
                  index={index}
                  theme={theme}
                  Icon={item.Icon}
                  title={item.title}
                  link={item.link}
                  isActive={item.link.split("/")[2] === locName}
                  isSideBarOpen={isSideBarOpen}
                />
              ))}
            </nav>
          </div>

          {(userData.role === "ADMIN" || userData.role === "MASTER" || userData.role === "INSTRUCTOR") ? (
              <div className="flex flex-col gap-2">
                <div className={`my-0 py-2 flex flex-col ${isSideBarOpen ? "items-start w-full" : "items-center w-full"}`}>
                  {isSideBarOpen && (
                      <Seperator text="Admin section" className="my-2 w-full" />
                  )}
                  <div
                      className={`flex items-center cursor-pointer group py-2 ${isSideBarOpen ? "px-3 mx-2 gap-3 justify-start w-[calc(100%-16px)] rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-300" : "justify-center w-10 h-10 mx-auto"}`}
                      onClick={() => {
                        if (!isSideBarOpen) setIsSideBarOpen(true);
                        setIsAccordionOpen((prev) => !prev);
                      }}
                  >
                    <BookAIcon size={22} />
                    {isSideBarOpen && (
                        <span className="text-base font-medium font-ubuntu text-center dark:text-white text-black group-hover:text-black/80 group-hover:dark:text-white/80">
                      Your Content
                    </span>
                    )}
                  </div>
                  <AnimatePresence>
                    {isAccordionOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
                        className="mt-2 w-full overflow-hidden"
                      >
                        <nav className={`py-0 my-0 ${isSideBarOpen ? "px-0" : "px-1"}`}>
                          {DashBoardNavItems3.map((item, index) => (
                              <DashboardNavItem
                                  key={index}
                                  index={index}
                                  theme={theme}
                                  Icon={item.Icon}
                                  title={item.title}
                                  link={item.link}
                                  isActive={item.link.split("/")[2] === locName}
                                  isSideBarOpen={isSideBarOpen}
                              />
                          ))}
                        </nav>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* New Admin Panel section */}
                <div className="w-full">
                  <nav className={`space-y-0 w-full ${isSideBarOpen ? "px-0" : "px-1"}`}>
                    {DashBoardAdminNavItems.map((item, index) => (
                        <DashboardNavItem
                            key={index}
                            index={index}
                            theme={theme}
                            Icon={item.Icon}
                            title={item.title}
                            link={item.link}
                            isActive={item.link.split("/")[2] === locName}
                            isSideBarOpen={isSideBarOpen}
                        />
                    ))}
                  </nav>
                </div>
              </div>
          ) : <></>}

          {(userData.role === "STUDENT" || userData.role === "INSTRUCTOR") && (
              <div className="flex flex-col gap-2">
                {isSideBarOpen && (
                    <Seperator text="Instructor section" className="my-2 w-full" />
                )}
                <nav className={`space-y-0 w-full ${isSideBarOpen ? "px-0" : "px-1"}`}>
                  {DashBoardInstructorNavItems
                      .filter(item =>
                          userData.role === "INSTRUCTOR"
                              ? item.title !== "Become Instructor"
                              : item.title === "Become Instructor"
                      )
                      .map((item, index) => (
                          <DashboardNavItem
                              key={index}
                              index={index}
                              theme={theme}
                              Icon={item.Icon}
                              title={item.title}
                              link={item.link}
                              isActive={item.link.split("/")[2] === locName}
                              isSideBarOpen={isSideBarOpen}
                          />
                      ))}
                </nav>
              </div>
          )}

           <div className={`flex justify-around flex-col w-full relative space-y-1 ${isSideBarOpen ? "items-start" : "items-center"}`}>
            <nav className={`space-y-0 ${isSideBarOpen ? "px-0" : "px-1"}`}>
              {DashBoardNavItems2.map((item, index) => (
                <DashboardNavItem
                  key={index}
                  index={index}
                  theme={theme}
                  Icon={item.Icon}
                  title={item.title}
                  link={item.link}
                  isActive={item.link.split("/")[2] === locName}
                  isSideBarOpen={isSideBarOpen}
                />
              ))}
            </nav>

            <div
              className={`flex flex-col items-center justify-center gap-3 relative w-full pt-4 border-t border-gray-200 dark:border-gray-800 ${!isSideBarOpen ? "px-1" : "px-0"}`}
            >
              {(() => {
                const enrolledCourses = userData.enrolledIn?.length || 0;
                const watchedVideos = userData.history?.length || 0;
                const bookmarkedCourses = userData.bookmarks?.course?.length || 0;
                
                const totalXP = (enrolledCourses * 50) + (watchedVideos * 5) + (bookmarkedCourses * 10);
                const currentLevel = Math.floor(totalXP / 200) + 1;
                const currentLevelXP = totalXP % 200;
                const progressPercent = (currentLevelXP / 200) * 100;
                
                let rank = "Novice";
                let badgeStyle = "bg-gradient-to-br from-gray-500 to-gray-700 text-white border-gray-400";
                let avatarStyle = "border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.4)]";
                let progressStyle = "from-gray-400 to-gray-600";
                let rankIcon = "🌱";

                if (currentLevel >= 50) {
                  rank = "Legend";
                  badgeStyle = "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white border-fuchsia-300";
                  avatarStyle = "spin-gradient-legend border-transparent shadow-[0_0_20px_rgba(217,70,239,0.5)]";
                  progressStyle = "from-violet-500 via-fuchsia-500 to-pink-500";
                  rankIcon = "✨";
                } else if (currentLevel >= 20) {
                  rank = "Master";
                  badgeStyle = "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 border-yellow-300";
                  avatarStyle = "spin-gradient-master border-transparent shadow-[0_0_20px_rgba(250,204,21,0.4)]";
                  progressStyle = "from-yellow-400 to-yellow-600";
                  rankIcon = "👑";
                } else if (currentLevel >= 10) {
                  rank = "Adept";
                  badgeStyle = "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 border-slate-200";
                  avatarStyle = "border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.5)]";
                  progressStyle = "from-slate-300 to-slate-500";
                  rankIcon = "⚔️";
                } else if (currentLevel >= 5) {
                  rank = "Scholar";
                  badgeStyle = "bg-gradient-to-br from-amber-600 to-amber-800 text-white border-amber-500";
                  avatarStyle = "border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.5)]";
                  progressStyle = "from-amber-500 to-amber-700";
                  rankIcon = "📜";
                }

                return (
                  <div className={`flex ${isSideBarOpen ? "w-full flex-row gap-3 items-center bg-gray-200/50 dark:bg-gray-900/50 p-2 rounded-2xl border border-gray-300 dark:border-gray-800 shadow-inner" : "flex-col gap-2 items-center"}`}>
                    <div className="relative group cursor-pointer">
                      <Link to="/edit-profile">
                        <Avatar className={`border-[3px] transition-all duration-500 group-hover:scale-110 ${avatarStyle} ${isSideBarOpen ? 'w-12 h-12' : 'w-10 h-10'}`}>
                          <AvatarImage src={userData.profileImageUrl} />
                          <AvatarFallback className="font-bold text-xl dark:text-black dark:bg-white text-white bg-black">
                            {userData.avatarFallbackText}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      {!isSideBarOpen && (
                        <div className={`absolute -bottom-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 shadow-lg whitespace-nowrap ${badgeStyle} ${currentLevel >= 50 ? 'animate-pulse' : ''}`}>
                          Lvl {currentLevel}
                        </div>
                      )}
                    </div>

                    {isSideBarOpen && (
                      <div className="flex flex-col w-full overflow-hidden justify-center">
                        <div className="flex justify-between items-center w-full mb-1">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate pr-2">
                            {userData.fullName}
                          </span>
                          <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm border ${badgeStyle} ${currentLevel >= 50 ? 'animate-pulse' : ''}`}>
                            <span>{rankIcon}</span>
                            <span>{rank} {currentLevel}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-300 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden shadow-inner relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`bg-gradient-to-r h-1.5 rounded-full relative overflow-hidden ${progressStyle}`}
                          >
                             {/* Shimmer effect inside the bar */}
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                          </motion.div>
                        </div>
                        <div className="flex justify-between w-full mt-1">
                          <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">{currentLevelXP} XP</span>
                          <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">{200} XP</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="w-full mt-2 mb-2 px-2">
                 <div className={`flex ${isSideBarOpen ? "flex-row justify-between items-center gap-2 w-full" : "flex-col items-center gap-3 w-full"}`}>
                   {/* Streak badge */}
                   <motion.div 
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     className={`flex items-center gap-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-orange-500/30 rounded-xl shadow-[0_0_10px_rgba(249,115,22,0.1)] cursor-pointer transition-all duration-300 ${isSideBarOpen ? "px-2.5 py-2.5" : "px-3 py-2 rounded-full"}`} 
                     title="Daily Streak"
                   >
                     <span className="text-orange-500 dark:text-orange-400 text-sm animate-pulse">🔥</span>
                     {isSideBarOpen && <span className="text-[10px] font-black tracking-wider text-orange-600 dark:text-orange-400 whitespace-nowrap">3 DAYS</span>}
                   </motion.div>

                   {/* Action buttons (Theme and Logout) */}
                   <div className={`flex ${isSideBarOpen ? "flex-row items-center gap-2" : "flex-col items-center gap-3 w-full"}`}>
                     <ModeToggle />
                     <Link to="/logout">
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         className="p-2.5 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-300 text-red-500 shadow-sm flex items-center justify-center w-10 h-10"
                         title="Logout"
                       >
                         <LogoutIcon fillColor="currentColor" size={20} />
                       </motion.button>
                     </Link>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
  );
};

export default React.memo(DashBoardNavbar);
