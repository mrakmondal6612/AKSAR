import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Progress, Textarea } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { USER_API } from "@/lib/env";
import { getVerifiedToken } from "@/lib/cookieService";
import { ErrorToast, SuccessToast } from "@/lib/toasts";

interface SurveyQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "rating";
  options?: string[];
  category: "interests" | "skills" | "preferences" | "goals";
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: "q1",
    question: "What are your primary learning interests?",
    type: "multiple",
    category: "interests",
    options: [
      "Web Development",
      "Mobile Development",
      "Data Science & AI",
      "Cloud Computing",
      "Cybersecurity",
      "DevOps",
      "UI/UX Design",
      "Blockchain",
      "Game Development",
      "Machine Learning",
    ],
  },
  {
    id: "q2",
    question: "What is your current skill level in programming?",
    type: "single",
    category: "skills",
    options: ["Complete Beginner", "Basic Knowledge", "Intermediate", "Advanced", "Expert"],
  },
  {
    id: "q3",
    question: "Which programming languages do you know?",
    type: "multiple",
    category: "skills",
    options: ["JavaScript", "Python", "Java", "C++", "C#", "Go", "Rust", "TypeScript", "PHP", "Ruby"],
  },
  {
    id: "q4",
    question: "How do you prefer to learn?",
    type: "multiple",
    category: "preferences",
    options: ["Video Tutorials", "Hands-on Projects", "Documentation", "Interactive Courses", "Mentorship", "Practice Problems"],
  },
  {
    id: "q5",
    question: "How many hours per week can you dedicate to learning?",
    type: "single",
    category: "preferences",
    options: ["Less than 5 hours", "5-10 hours", "10-20 hours", "20-30 hours", "30+ hours"],
  },
  {
    id: "q6",
    question: "What is your primary learning goal?",
    type: "single",
    category: "goals",
    options: ["Get a Job", "Switch Careers", "Upskill for Current Role", "Start a Business", "Personal Interest", "Academic Requirements"],
  },
  {
    id: "q7",
    question: "When do you want to achieve your goal?",
    type: "single",
    category: "goals",
    options: ["1-3 months", "3-6 months", "6-12 months", "1-2 years", "No specific timeline"],
  },
  {
    id: "q8",
    question: "Tell us about any specific topics you want to learn (optional)",
    type: "text",
    category: "interests",
  },
  {
    id: "q9",
    question: "Rate your interest in the following areas (1-5):",
    type: "rating",
    category: "interests",
    options: ["Frontend Development", "Backend Development", "Database Management", "System Design", "Testing"],
  },
];

const OnboardingSurvey: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratingValues, setRatingValues] = useState<Record<string, number>>({});

  const currentQuestion = surveyQuestions[currentStep];
  const progress = ((currentStep + 1) / surveyQuestions.length) * 100;

  const handleOptionSelect = (questionId: string, option: string) => {
    if (currentQuestion.type === "single") {
      setAnswers({ ...answers, [questionId]: option });
    } else if (currentQuestion.type === "multiple") {
      const currentAnswers = answers[questionId] || [];
      if (currentAnswers.includes(option)) {
        setAnswers({
          ...answers,
          [questionId]: currentAnswers.filter((a: string) => a !== option),
        });
      } else {
        setAnswers({
          ...answers,
          [questionId]: [...currentAnswers, option],
        });
      }
    }
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleRatingChange = (option: string, value: number) => {
    setRatingValues({ ...ratingValues, [option]: value });
  };

  const handleNext = () => {
    if (currentQuestion.type === "rating") {
      setAnswers({ ...answers, [currentQuestion.id]: ratingValues });
    }
    if (currentStep < surveyQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentQuestion.type === "rating") {
      setAnswers({ ...answers, [currentQuestion.id]: ratingValues });
    }

    setIsSubmitting(true);
    const jwt = getVerifiedToken();

    try {
      const surveyData = {
        interests: answers.q1 || [],
        skillLevel: answers.q2,
        programmingLanguages: answers.q3 || [],
        learningPreferences: answers.q4 || [],
        weeklyHours: answers.q5,
        learningGoal: answers.q6,
        timeline: answers.q7,
        specificTopics: answers.q8,
        areaRatings: answers.q9 || {},
      };

      const response = await axios.post(
        `${USER_API}/update-interests`,
        {
          interests: surveyData.interests,
          interestTags: [...surveyData.programmingLanguages, surveyData.specificTopics].filter(Boolean),
          learningGoal: surveyData.learningGoal,
          experienceLevel: surveyData.skillLevel,
          onboardingCompleted: true,
        },
        {
          headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        }
      );

      if (response.data?.success) {
        SuccessToast("Survey completed successfully!");
        navigate("/user/dashboard");
      } else {
        ErrorToast(response.data.message);
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to submit survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentQuestion.type === "single") {
      return !!answers[currentQuestion.id];
    } else if (currentQuestion.type === "multiple") {
      return (answers[currentQuestion.id] || []).length > 0;
    } else if (currentQuestion.type === "text") {
      return true; // Text is optional
    } else if (currentQuestion.type === "rating") {
      return Object.keys(ratingValues).length > 0;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
            Welcome to AKSAR! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's personalize your learning experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {surveyQuestions.length}
            </span>
            <span className="text-sm font-bold text-purple-600">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            color="primary"
            className="h-2"
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium mb-3">
                {currentQuestion.category.toUpperCase()}
              </span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                {currentQuestion.question}
              </h2>

              {currentQuestion.type === "single" && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionSelect(currentQuestion.id, option)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        answers[currentQuestion.id] === option
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                      }`}
                    >
                      <span className="text-gray-800 dark:text-white">{option}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "multiple" && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionSelect(currentQuestion.id, option)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        (answers[currentQuestion.id] || []).includes(option)
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 dark:text-white">{option}</span>
                        {(answers[currentQuestion.id] || []).includes(option) && (
                          <span className="text-purple-500">✓</span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "text" && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                  className="w-full"
                  minRows={4}
                />
              )}

              {currentQuestion.type === "rating" && currentQuestion.options && (
                <div className="space-y-4">
                  {currentQuestion.options.map((option) => (
                    <div key={option} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <span className="text-gray-800 dark:text-white font-medium">{option}</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <motion.button
                            key={rating}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRatingChange(option, rating)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                              ratingValues[option] === rating
                                ? "bg-purple-500 text-white"
                                : ratingValues[option] && rating <= ratingValues[option]
                                ? "bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300"
                                : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                            }`}
                          >
                            {rating}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            color="default"
            variant="flat"
            onClick={handlePrevious}
            isDisabled={currentStep === 0}
          >
            Previous
          </Button>

          {currentStep === surveyQuestions.length - 1 ? (
            <Button
              color="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={!canProceed()}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              Complete Setup 🚀
            </Button>
          ) : (
            <Button
              color="primary"
              onClick={handleNext}
              isDisabled={!canProceed()}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              Next
            </Button>
          )}
        </div>

        {/* Skip Button */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/user/dashboard")}
            className="text-sm text-gray-500 hover:text-purple-500 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingSurvey;
