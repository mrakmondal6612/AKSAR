import { motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";
import { Tooltip } from "@nextui-org/react"; // Optional: You can replace it with your custom tooltip if needed

import { useDashboardContext } from "@/context/dashboardContext";

interface DashBoardIconProps {
  fillColor?: string;
  size?: number;
}

interface DashboardNavItemProps {
  index: number;
  theme: string;
  Icon: React.ComponentType<DashBoardIconProps>;
  title: string;
  link: string;
  isSideBarOpen: boolean;
  isActive:boolean;
}

const DashboardNavItem: React.FC<DashboardNavItemProps> = ({
  index,
  theme,
  Icon,
  title,
  link,
  isActive,
  isSideBarOpen,
}) => {
  const { setIsSideBarOpen } = useDashboardContext();
  const isHot = title === "Community" || title === "Modern Todo List";
  const isNew = title === "Certificate";

  const handleClick = () => {
    // Automatically close sidebar on smaller screens when navigating
    if (window.innerWidth < 768 && isSideBarOpen) {
      setIsSideBarOpen(false);
    }
  };

  const getQuestInfo = (title: string) => {
    switch (title) {
      case "Dashboard":
        return { desc: "Access your learning portal & activity stats.", xp: "+10 XP daily goal" };
      case "Courses":
        return { desc: "Enroll in quests to learn new skills.", xp: "+50 XP on enrollment" };
      case "Community":
        return { desc: "Discuss topics with fellow coders.", xp: "Boost your community rank" };
      case "Modern Todo List":
        return { desc: "Check off your learning checklists.", xp: "+10 XP per task complete" };
      case "Certificate":
        return { desc: "Claim your verified diplomas.", xp: "Proof of mastery" };
      default:
        return { desc: `Navigate to ${title}.`, xp: "Quest active" };
    }
  };

  const quest = getQuestInfo(title);

  return (
    <motion.div
      key={index}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.05,
      }}
      className={`relative w-full group dashboard_li_item mb-1`}
    >
      <Link
        onClick={handleClick}
        to={link}
        className={`
          flex items-center transition-all duration-300 relative overflow-hidden
          ${isSideBarOpen 
            ? "space-x-3 py-2 px-3 mx-2 justify-start" 
            : "py-2 px-0 mx-auto justify-center w-10 h-10"}
          ${isActive 
            ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] border border-indigo-500/20" 
            : "hover:bg-gray-100 dark:hover:bg-gray-800/50"}
        `}
      >
        {/* Active state neon border */}
        {isActive && isSideBarOpen && (
          <motion.div 
            layoutId="activeNavIndicator"
            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] rounded-r-full"
          />
        )}
        {isActive && !isSideBarOpen && (
          <motion.div 
            layoutId="activeNavIndicatorClosed"
            className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] rounded-r-full"
          />
        )}

        <div className={`relative flex items-center justify-center p-1.5 rounded-lg transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
          <Tooltip 
            isDisabled={isSideBarOpen}
            showArrow
            placement="right"
            content={
              <div className="flex flex-col gap-1 text-left max-w-[200px] p-1 font-ubuntu">
                <span className="font-bold text-white text-xs flex items-center gap-1">
                  ⚔️ {title}
                </span>
                <span className="text-[10px] text-indigo-200 leading-snug">
                  {quest.desc}
                </span>
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest mt-1">
                  {quest.xp}
                </span>
              </div>
            }
            classNames={{
              base: "before:bg-[#0b0f19] border border-gray-800",
              content: "py-2 px-3.5 shadow-xl text-white bg-[#0b0f19] rounded-xl border border-gray-800/50",
            }}
          >
            <div>
              {theme === "dark" ? (
                <Icon fillColor={isActive ? "#818cf8" : "white"} size={22} />
              ) : (
                <Icon fillColor={isActive ? "#4f46e5" : "black"} size={22} />
              )}
            </div>
          </Tooltip>
        </div>

        {isSideBarOpen && (
          <div className="flex justify-between items-center w-full">
            <span
              className={`text-sm font-bold font-ubuntu transition-colors duration-300 
                ${isActive 
                  ? "text-indigo-600 dark:text-indigo-400" 
                  : "text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white"
                }`}
            >
              {title}
            </span>
            
            {/* Gamification Badges */}
            {isHot && (
              <span className="text-[9px] font-black tracking-wider text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/40 px-1.5 py-0.5 rounded shadow-sm border border-orange-200 dark:border-orange-800/50">
                HOT
              </span>
            )}
            {isNew && !isHot && (
              <span className="text-[9px] font-black tracking-wider text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                NEW
              </span>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
};

export default React.memo(DashboardNavItem);