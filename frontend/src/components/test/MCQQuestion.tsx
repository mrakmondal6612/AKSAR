import React from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MCQQuestionProps {
  question: {
    questionId: string;
    questionText: string;
    options?: string[];
    points: number;
  };
  answer: string | string[];
  onAnswerChange: (answer: string | string[]) => void;
}

const MCQQuestion: React.FC<MCQQuestionProps> = ({ question, answer, onAnswerChange }) => {
  const selectedAnswers = Array.isArray(answer) ? answer : answer ? [answer] : [];

  const handleOptionClick = (option: string) => {
    if (selectedAnswers.includes(option)) {
      // Deselect if already selected
      const newAnswers = selectedAnswers.filter((a) => a !== option);
      onAnswerChange(newAnswers);
    } else {
      // Select (assuming single select for now, can be changed to multiple)
      onAnswerChange([option]);
    }
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option, index) => {
        const isSelected = selectedAnswers.includes(option);
        const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...

        return (
          <Card
            key={index}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
            onClick={() => handleOptionClick(option)}
          >
            <div className="flex items-center gap-4 p-4">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isSelected ? <Check className="h-4 w-4" /> : optionLabel}
              </div>
              <span className="flex-1 text-slate-900 dark:text-slate-100">
                {option}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MCQQuestion;
