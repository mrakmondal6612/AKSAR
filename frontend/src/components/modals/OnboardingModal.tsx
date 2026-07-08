import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { useAuthContext } from "@/context/authContext";
import { getVerifiedToken } from "@/lib/cookieService";
import { USER_API } from "@/lib/env";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import axios from "axios";

// ── Types ──────────────────────────────────────────────────────────────────────
interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

const COURSE_TYPES = [
    { value: "TECH",      label: "Tech / Programming",  emoji: "💻" },
    { value: "YOUTUBE",   label: "YouTube Courses",      emoji: "▶️"  },
    { value: "SEMESTER",  label: "Semester / Academic",  emoji: "🎓" },
    { value: "PERSONAL",  label: "Personal Tutors",      emoji: "👨‍🏫" },
    { value: "REDIRECT",  label: "External Courses",     emoji: "🔗" },
];

const INTEREST_TAGS = [
    "Web Development", "DSA & Algorithms", "AI / ML",
    "System Design", "Mobile Dev", "DevOps / Cloud",
    "Data Science", "Cybersecurity", "Database",
    "JavaScript", "Python", "Java", "C++",
    "Physics", "Mathematics", "Chemistry",
    "English", "Communication", "Design",
];

const LEARNING_GOALS = [
    { value: "get_a_job",   label: "Get a job / internship",  emoji: "💼" },
    { value: "upskill",     label: "Upskill at work",          emoji: "📈" },
    { value: "academic",    label: "Academic / exam prep",     emoji: "📚" },
    { value: "hobby",       label: "Just exploring",           emoji: "🌱" },
];

const EXPERIENCE_LEVELS = [
    { value: "beginner",     label: "Beginner",      desc: "Just starting out"         },
    { value: "intermediate", label: "Intermediate",  desc: "Comfortable with basics"   },
    { value: "advanced",     label: "Advanced",      desc: "Looking to go deeper"      },
];

const WEEKLY_HOURS = [
    { value: "less_5",   label: "Less than 5 hours",   emoji: "⏰" },
    { value: "5_10",      label: "5-10 hours",          emoji: "⏱️" },
    { value: "10_20",     label: "10-20 hours",         emoji: "⏳" },
    { value: "20_30",     label: "20-30 hours",         emoji: "🕐" },
    { value: "30_plus",   label: "30+ hours",           emoji: "🔥" },
];

const LEARNING_PREFERENCES = [
    { value: "video",      label: "Video Tutorials",    emoji: "🎬" },
    { value: "hands_on",   label: "Hands-on Projects",  emoji: "🛠️" },
    { value: "docs",       label: "Documentation",      emoji: "📖" },
    { value: "interactive", label: "Interactive Courses", emoji: "🎮" },
    { value: "mentorship", label: "Mentorship",         emoji: "👨‍🏫" },
    { value: "practice",   label: "Practice Problems",  emoji: "✏️" },
];

const PROGRAMMING_LANGUAGES = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin"
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStepBubbleClass(stepNum: number, currentStep: number): string {
    if (stepNum === currentStep) return "bg-purple-500 text-white";
    if (stepNum < currentStep) return "bg-green-500 text-white";
    return "bg-gray-200 dark:bg-gray-700 text-gray-500";
}

// ── Component ─────────────────────────────────────────────────────────────────
const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
    const { setUserData, userData } = useAuthContext();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);

    // Step 1
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    // Step 2
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState("");
    // Step 3
    const [learningGoal, setLearningGoal] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    // Step 4
    const [weeklyHours, setWeeklyHours] = useState("");
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
    // Step 5
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    const toggleItem = <T extends string>(
        item: T,
        _selected: T[],
        setSelected: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        setSelected((prev) =>
            prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
        );
    };

    const addCustomTag = () => {
        const tag = customTag.trim();
        if (tag && !selectedTags.includes(tag) && selectedTags.length < 10) {
            setSelectedTags((prev) => [...prev, tag]);
        }
        setCustomTag("");
    };

    const canProceedStep1 = selectedTypes.length > 0;
    const canProceedStep2 = selectedTags.length > 0;
    const canProceedStep3 = !!learningGoal && !!experienceLevel;
    const canProceedStep4 = !!weeklyHours && selectedPreferences.length > 0;
    const canProceedStep5 = selectedLanguages.length > 0;

    const handleSubmit = async () => {
        setLoading(true);
        const jwt = getVerifiedToken();
        try {
            const response = await axios.put(
                `${USER_API}/update-interests`,
                {
                    interests: selectedTypes,
                    interestTags: [...selectedTags, ...selectedLanguages],
                    learningGoal,
                    experienceLevel,
                    onboardingCompleted: true,
                },
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                SuccessToast("Your interests are saved! 🎉");
                setUserData({
                    ...userData,
                    interests: selectedTypes,
                    interestTags: [...selectedTags, ...selectedLanguages],
                    learningGoal,
                    experienceLevel,
                    onboardingCompleted: true,
                });
                onComplete();
            } else {
                ErrorToast(response.data.message || "Failed to save interests");
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }; status?: number } };
            console.error("Onboarding save error:", err?.response);
            ErrorToast(err?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        // Mark onboarding done even if skipped so we don't re-show
        setLoading(true);
        const jwt = getVerifiedToken();
        try {
            await axios.put(
                `${USER_API}/update-interests`,
                { interests: [], interestTags: [], learningGoal: "hobby", experienceLevel: "beginner" },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
        } catch { /* silent */ }
        setUserData({ ...userData, onboardingCompleted: true });
        setLoading(false);
        onComplete();
    };

    const stepLabels = ["Course types", "Topics", "Goals", "Schedule", "Skills"];

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleSkip}
            isDismissable={false}
            hideCloseButton
            size="lg"
            classNames={{
                base: "dark:bg-gray-900 bg-white",
                wrapper: "z-[9999]",
            }}
        >
            <ModalContent>
                {/* Progress bar */}
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>

                <ModalHeader className="flex flex-col gap-1 pb-2">
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-1">
                        {stepLabels.map((label, i) => (
                            <React.Fragment key={label}>
                                <div className="flex items-center gap-1">
                  <span
                      className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors ${getStepBubbleClass(i + 1, step)}`}
                  >
                    {i + 1 < step ? "✓" : i + 1}
                  </span>
                                    <span className={`text-xs hidden sm:block ${i + 1 === step ? "text-purple-500 font-semibold" : "text-gray-400"}`}>
                    {label}
                  </span>
                                </div>
                                {i < 4 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />}
                            </React.Fragment>
                        ))}
                    </div>

                    {step === 1 && (
                        <>
                            <h2 className="text-xl font-bold font-ubuntu text-gray-800 dark:text-white">
                                What kind of courses interest you? 🎯
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                                Select all that apply — we'll use this to personalise your dashboard.
                            </p>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <h2 className="text-xl font-bold font-ubuntu text-gray-800 dark:text-white">
                                Pick your topics 📌
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                                Choose topics you want to learn. Add your own too.
                            </p>
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <h2 className="text-xl font-bold font-ubuntu text-gray-800 dark:text-white">
                                Almost done! Tell us about yourself 🙌
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                                This helps us show the right level of content for you.
                            </p>
                        </>
                    )}
                    {step === 4 && (
                        <>
                            <h2 className="text-xl font-bold font-ubuntu text-gray-800 dark:text-white">
                                Your learning schedule 📅
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                                How much time can you dedicate and how do you prefer to learn?
                            </p>
                        </>
                    )}
                    {step === 5 && (
                        <>
                            <h2 className="text-xl font-bold font-ubuntu text-gray-800 dark:text-white">
                                Your programming skills 💻
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                                Select languages you know or want to learn.
                            </p>
                        </>
                    )}
                </ModalHeader>

                <ModalBody className="py-3 max-h-[55vh] overflow-y-auto scrollbar-thin">
                    {/* ── Step 1: Course types ─────────────────────────────────── */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {COURSE_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => toggleItem(type.value, selectedTypes, setSelectedTypes)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                                        selectedTypes.includes(type.value)
                                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                                    }`}
                                >
                                    <span className="text-2xl">{type.emoji}</span>
                                    <span className={`font-ubuntu font-medium text-sm ${
                                        selectedTypes.includes(type.value)
                                            ? "text-purple-700 dark:text-purple-300"
                                            : "text-gray-700 dark:text-gray-300"
                                    }`}>
                    {type.label}
                  </span>
                                    {selectedTypes.includes(type.value) && (
                                        <span className="ml-auto text-purple-500 font-bold">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Step 2: Interest tags ────────────────────────────────── */}
                    {step === 2 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                                {INTEREST_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleItem(tag, selectedTags, setSelectedTags)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-ubuntu border transition-all duration-150 ${
                                            selectedTags.includes(tag)
                                                ? "border-purple-500 bg-purple-500 text-white"
                                                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400"
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {/* Custom tag input */}
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="text"
                                    value={customTag}
                                    onChange={(e) => setCustomTag(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                                    placeholder="Add your own topic..."
                                    maxLength={30}
                                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:outline-none focus:border-purple-400"
                                />
                                <button
                                    onClick={addCustomTag}
                                    disabled={!customTag.trim()}
                                    className="px-3 py-2 rounded-lg bg-purple-500 text-white text-sm disabled:opacity-40 hover:bg-purple-600 transition-colors"
                                >
                                    Add
                                </button>
                            </div>

                            {selectedTags.length > 0 && (
                                <p className="text-xs text-gray-400">
                                    {selectedTags.length} topic{selectedTags.length > 1 ? "s" : ""} selected
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Step 3: Goal + experience ────────────────────────────── */}
                    {step === 3 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    What's your main learning goal?
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {LEARNING_GOALS.map((g) => (
                                        <button
                                            key={g.value}
                                            onClick={() => setLearningGoal(g.value)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                                learningGoal === g.value
                                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                                            }`}
                                        >
                                            <span className="text-xl">{g.emoji}</span>
                                            <span className={`text-xs font-ubuntu font-medium ${
                                                learningGoal === g.value ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"
                                            }`}>
                        {g.label}
                      </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    What's your experience level?
                                </p>
                                <div className="flex flex-col gap-2">
                                    {EXPERIENCE_LEVELS.map((lvl) => (
                                        <button
                                            key={lvl.value}
                                            onClick={() => setExperienceLevel(lvl.value)}
                                            className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                                experienceLevel === lvl.value
                                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                                            }`}
                                        >
                                            <div>
                                                <p className={`text-sm font-ubuntu font-semibold ${
                                                    experienceLevel === lvl.value ? "text-purple-700 dark:text-purple-300" : "text-gray-700 dark:text-gray-300"
                                                }`}>
                                                    {lvl.label}
                                                </p>
                                                <p className="text-xs text-gray-400">{lvl.desc}</p>
                                            </div>
                                            {experienceLevel === lvl.value && (
                                                <span className="text-purple-500 font-bold text-lg">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Weekly hours + learning preferences ───────────────── */}
                    {step === 4 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    How many hours per week can you dedicate?
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {WEEKLY_HOURS.map((h) => (
                                        <button
                                            key={h.value}
                                            onClick={() => setWeeklyHours(h.value)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                                weeklyHours === h.value
                                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                                            }`}
                                        >
                                            <span className="text-xl">{h.emoji}</span>
                                            <span className={`text-xs font-ubuntu font-medium ${
                                                weeklyHours === h.value ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"
                                            }`}>
                                                {h.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    How do you prefer to learn? (select all that apply)
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {LEARNING_PREFERENCES.map((pref) => (
                                        <button
                                            key={pref.value}
                                            onClick={() => toggleItem(pref.value, selectedPreferences, setSelectedPreferences)}
                                            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                                selectedPreferences.includes(pref.value)
                                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                                            }`}
                                        >
                                            <span className="text-xl">{pref.emoji}</span>
                                            <span className={`text-xs font-ubuntu font-medium ${
                                                selectedPreferences.includes(pref.value) ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"
                                            }`}>
                                                {pref.label}
                                            </span>
                                            {selectedPreferences.includes(pref.value) && (
                                                <span className="ml-auto text-purple-500 font-bold">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 5: Programming languages ───────────────────────────── */}
                    {step === 5 && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                                {PROGRAMMING_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => toggleItem(lang, selectedLanguages, setSelectedLanguages)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-ubuntu border transition-all duration-150 ${
                                            selectedLanguages.includes(lang)
                                                ? "border-purple-500 bg-purple-500 text-white"
                                                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400"
                                        }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>

                            {selectedLanguages.length > 0 && (
                                <p className="text-xs text-gray-400">
                                    {selectedLanguages.length} language{selectedLanguages.length > 1 ? "s" : ""} selected
                                </p>
                            )}
                        </div>
                    )}
                </ModalBody>

                <ModalFooter className="flex justify-between items-center pt-2">
                    <button
                        onClick={handleSkip}
                        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline transition-colors"
                    >
                        Skip for now
                    </button>

                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button
                                variant="bordered"
                                size="sm"
                                onClick={() => setStep((s) => (s - 1) as Step)}
                                className="font-ubuntu"
                            >
                                Back
                            </Button>
                        )}

                        {step < 5 ? (
                            <Button
                                size="sm"
                                isDisabled={
                                    (step === 1 && !canProceedStep1) ||
                                    (step === 2 && !canProceedStep2) ||
                                    (step === 3 && !canProceedStep3) ||
                                    (step === 4 && !canProceedStep4)
                                }
                                className="bg-purple-500 text-white font-ubuntu hover:bg-purple-600 disabled:opacity-40"
                                onClick={() => setStep((s) => (s + 1) as Step)}
                            >
                                Next →
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                isDisabled={!canProceedStep5 || loading}
                                isLoading={loading}
                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-ubuntu"
                                onClick={handleSubmit}
                            >
                                Save & Continue 🚀
                            </Button>
                        )}
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default OnboardingModal;