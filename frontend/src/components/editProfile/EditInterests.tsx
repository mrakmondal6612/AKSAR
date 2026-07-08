import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { useAuthContext } from "@/context/authContext";
import { getVerifiedToken } from "@/lib/cookieService";
import { USER_API } from "@/lib/env";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import axios from "axios";

const COURSE_TYPES = [
    { value: "TECH",      label: "Tech / Programming",  emoji: "💻" },
    { value: "YOUTUBE",   label: "YouTube Courses",      emoji: "▶️"  },
    { value: "SEMESTER",  label: "Semester / Academic",  emoji: "🎓" },
    { value: "PERSONAL",  label: "Personal Tutors",      emoji: "👨‍🏫" },
    { value: "REDIRECT",  label: "External Courses",     emoji: "🔗" },
];

const PRESET_TAGS = [
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
    { value: "beginner",     label: "Beginner"      },
    { value: "intermediate", label: "Intermediate"  },
    { value: "advanced",     label: "Advanced"      },
];

const EditInterests: React.FC = () => {
    const { userData, setUserData } = useAuthContext();

    const [selectedTypes, setSelectedTypes] = useState<string[]>(userData.interests || []);
    const [selectedTags, setSelectedTags] = useState<string[]>(userData.interestTags || []);
    const [learningGoal, setLearningGoal] = useState(userData.learningGoal || "");
    const [experienceLevel, setExperienceLevel] = useState(userData.experienceLevel || "");
    const [customTag, setCustomTag] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSelectedTypes(userData.interests || []);
        setSelectedTags(userData.interestTags || []);
        setLearningGoal(userData.learningGoal || "");
        setExperienceLevel(userData.experienceLevel || "");
    }, [userData.interests, userData.interestTags, userData.learningGoal, userData.experienceLevel]);

    const toggle = <T extends string>(
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
        if (tag && !selectedTags.includes(tag) && selectedTags.length < 15) {
            setSelectedTags((prev) => [...prev, tag]);
        }
        setCustomTag("");
    };

    const handleSave = async () => {
        setLoading(true);
        const jwt = getVerifiedToken();
        try {
            const response = await axios.put(
                `${USER_API}/update-interests`,
                { interests: selectedTypes, interestTags: selectedTags, learningGoal, experienceLevel },
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.data.success) {
                SuccessToast("Interests updated!");
                setUserData({
                    ...userData,
                    interests: selectedTypes,
                    interestTags: selectedTags,
                    learningGoal,
                    experienceLevel,
                    onboardingCompleted: true,
                });
            } else {
                ErrorToast(response.data.message);
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            ErrorToast(err?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 p-1">
            {/* Course types */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Course types you're interested in
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COURSE_TYPES.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => toggle(type.value, selectedTypes, setSelectedTypes)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all duration-150 ${
                                selectedTypes.includes(type.value)
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                            }`}
                        >
                            <span>{type.emoji}</span>
                            <span className={`text-xs font-ubuntu font-medium ${
                                selectedTypes.includes(type.value)
                                    ? "text-purple-700 dark:text-purple-300"
                                    : "text-gray-600 dark:text-gray-400"
                            }`}>
                {type.label}
              </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Interest tags */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Topics you want to learn
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_TAGS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => toggle(tag, selectedTags, setSelectedTags)}
                            className={`px-3 py-1.5 rounded-full text-xs font-ubuntu border transition-all duration-150 ${
                                selectedTags.includes(tag)
                                    ? "border-purple-500 bg-purple-500 text-white"
                                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400"
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                    {/* show custom tags that are not in the preset list */}
                    {selectedTags
                        .filter((t) => !PRESET_TAGS.includes(t))
                        .map((tag) => (
                            <button
                                key={tag}
                                onClick={() => toggle(tag, selectedTags, setSelectedTags)}
                                className="px-3 py-1.5 rounded-full text-xs font-ubuntu border border-purple-500 bg-purple-500 text-white"
                            >
                                {tag} ✕
                            </button>
                        ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                        placeholder="Add custom topic..."
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
            </div>

            {/* Learning goal */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Learning goal
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {LEARNING_GOALS.map((g) => (
                        <button
                            key={g.value}
                            onClick={() => setLearningGoal(g.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all duration-150 ${
                                learningGoal === g.value
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                    : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                            }`}
                        >
                            <span>{g.emoji}</span>
                            <span className={`text-xs font-ubuntu font-medium ${
                                learningGoal === g.value ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"
                            }`}>
                {g.label}
              </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Experience level */}
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Experience level
                </p>
                <div className="flex gap-2">
                    {EXPERIENCE_LEVELS.map((lvl) => (
                        <button
                            key={lvl.value}
                            onClick={() => setExperienceLevel(lvl.value)}
                            className={`flex-1 py-2 rounded-xl border-2 text-sm font-ubuntu font-medium transition-all duration-150 ${
                                experienceLevel === lvl.value
                                    ? "border-purple-500 bg-purple-500 text-white"
                                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300"
                            }`}
                        >
                            {lvl.label}
                        </button>
                    ))}
                </div>
            </div>

            <Button
                isLoading={loading}
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-ubuntu font-semibold"
            >
                Save Interests
            </Button>
        </div>
    );
};

export default EditInterests;