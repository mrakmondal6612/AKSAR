import React from "react";
import UserCourseCard from "@/components/UserCourseCard";
import { IUserCourseData } from "@/constants";
import { useAuthContext } from "@/context/authContext";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import AfternoonSunIcon from "@/Icons/AfternoonSunIcon";
import MorningEveningSunIcon from "@/Icons/MorningEveningSunIcon";
import NightMoonIcon from "@/Icons/NightMoonIcon";
import { getVerifiedToken } from "@/lib/cookieService";
import axios from "axios";
import { COURSE_API } from "@/lib/env";
import { ErrorToast } from "@/lib/toasts";
import TextFlipSmoothRevealEffect from "@/Effects/TextFlipSmoothRevealEffect";
import { Button } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import OnboardingModal from "@/components/modals/OnboardingModal";

type DashboardTab = "suggested" | "enrolled";

const DashBoard = () => {
  const { userData, isUserDataLoaded } = useAuthContext();
  const [timeGreeting, setTimeGreeting] = React.useState("Hello");
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("suggested");
  const [enrolledCourses, setEnrolledCourses] = React.useState<IUserCourseData[]>([]);
  const [suggestedCourses, setSuggestedCourses] = React.useState<IUserCourseData[]>([]);
  const [enrolledLoading, setEnrolledLoading] = React.useState(false);
  const [suggestedLoading, setSuggestedLoading] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const onboardingShownRef = React.useRef(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Show onboarding only after real user data is loaded from server
  React.useEffect(() => {
    // Treat undefined as false (not completed)
    const isOnboardingComplete = userData.onboardingCompleted === true;
    
    if (
        isUserDataLoaded &&
        !isOnboardingComplete &&
        !onboardingShownRef.current
    ) {
      onboardingShownRef.current = true;
      setShowOnboarding(true);
    }
  }, [isUserDataLoaded, userData.onboardingCompleted]);

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12 && hour >= 4) setTimeGreeting("Good Morning");
    else if (hour < 16 && hour >= 12) setTimeGreeting("Good Afternoon");
    else if (hour >= 16 && hour < 21) setTimeGreeting("Good Evening");
    else setTimeGreeting("Night Owl");
  }, []);

  const fetchEnrolledCourses = React.useCallback(async () => {
    const jwt = getVerifiedToken();
    setEnrolledLoading(true);
    try {
      const response = await axios.get(`${COURSE_API}/get-user-enrolled-courses`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (response?.data?.success) {
        setEnrolledCourses(response.data.data);
      } else {
        ErrorToast(response.data.message);
        setEnrolledCourses([]);
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      ErrorToast(err?.response?.data?.message || "Something went wrong");
      setEnrolledCourses([]);
    } finally {
      setEnrolledLoading(false);
    }
  }, []);

  const fetchSuggestedCourses = React.useCallback(async () => {
    const jwt = getVerifiedToken();
    setSuggestedLoading(true);
    try {
      const response = await axios.get(`${COURSE_API}/get-suggested-courses`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (response?.data?.success) {
        setSuggestedCourses(response.data.data);
      } else {
        setSuggestedCourses([]);
      }
    } catch {
      setSuggestedCourses([]);
    } finally {
      setSuggestedLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEnrolledCourses();
    fetchSuggestedCourses();
  }, [fetchEnrolledCourses, fetchSuggestedCourses]);

  // Re-fetch suggested after onboarding completes
  const handleOnboardingComplete = React.useCallback(() => {
    setShowOnboarding(false);
    fetchSuggestedCourses();
  }, [fetchSuggestedCourses]);

  const isLoading = activeTab === "suggested" ? suggestedLoading : enrolledLoading;
  const courses = activeTab === "suggested" ? suggestedCourses : enrolledCourses;

  return (
      <>
        <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />

        <motion.div
            className="w-full flex flex-col gap-2 rounded-lg p-2 sm:p-4"
            variants={{
              hidden: { opacity: 0.3, scale: 0.8 },
              visible: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.8 },
            }}
            transition={{ duration: 0.3 }}
        >
          {/* Greeting */}
          <motion.div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 px-2">
            {timeGreeting === "Good Afternoon" ? (
                <AfternoonSunIcon fillColor="rgb(253 224 71)" />
            ) : timeGreeting === "Night Owl" ? (
                <NightMoonIcon fillColor={theme === "dark" ? "white" : "black"} size={30} />
            ) : (
                <MorningEveningSunIcon fillColor="rgb(253 224 71)" />
            )}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold font-libre bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            <span className="text-2xl sm:text-3xl md:text-4xl font-medium font-ubuntu">
              {timeGreeting}
            </span>
              ,{" "}
              <TextFlipSmoothRevealEffect
                  text={`${userData.fullName}!`}
                  className="text-xl sm:text-2xl md:text-3xl font-libre underline"
              />
            </h1>
          </motion.div>

          {/* Interests hint banner (shown when no interests set and onboarding done) */}
          {userData.onboardingCompleted && (!userData.interests || userData.interests.length === 0) && (
              <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-2 mb-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-center justify-between gap-2"
              >
                <p className="text-xs text-purple-700 dark:text-purple-300 font-ubuntu">
                  🎯 Set your interests to get personalised course suggestions.
                </p>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-600 dark:text-purple-300 text-xs font-ubuntu shrink-0"
                    onClick={() => navigate("/edit-profile")}
                >
                  Update now
                </Button>
              </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 px-2 mb-1">
            {(["suggested", "enrolled"] as DashboardTab[]).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-ubuntu font-medium transition-all duration-200 ${
                        activeTab === tab
                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  {tab === "suggested" ? "✨ Suggested" : "📚 Enrolled"}
                  {tab === "enrolled" && enrolledCourses.length > 0 && (
                      <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                          activeTab === "enrolled"
                              ? "bg-white/30 text-white"
                              : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300"
                      }`}>
                  {enrolledCourses.length}
                </span>
                  )}
                </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
          >
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2 py-4">
                  {[...Array(4)].map((_, i) => (
                      <div key={i} className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-56" />
                  ))}
                </div>
            ) : courses.length === 0 ? (
                <EmptyState
                    tab={activeTab}
                    onNavigate={() =>
                        activeTab === "enrolled"
                            ? navigate("/courses")
                            : navigate("/edit-profile")
                    }
                />
            ) : (
                <UserCourseCard courses={courses} mode={activeTab} />
            )}
          </motion.div>
        </motion.div>
      </>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  tab: DashboardTab;
  onNavigate: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ tab, onNavigate }) => (
    <div className="w-full flex flex-col justify-center items-center gap-4 p-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-300 dark:border-yellow-800 rounded-xl shadow-sm mx-2 my-2">
      <p className="text-base font-ubuntu text-center text-yellow-800 dark:text-yellow-300">
        {tab === "enrolled"
            ? "You haven't enrolled in any course yet."
            : "No suggestions yet — update your interests to see personalised courses."}
      </p>
      <Button
          variant="bordered"
          onClick={onNavigate}
          className="px-4 py-2 bg-yellow-500 text-white font-ubuntu text-sm rounded-md shadow-md hover:bg-yellow-600 transition-all duration-300 border-none"
      >
        {tab === "enrolled" ? "Browse Courses" : "Update Interests"}
      </Button>
    </div>
);

export default DashBoard;