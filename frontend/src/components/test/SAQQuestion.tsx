import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface SAQQuestionProps {
  question: {
    questionId: string;
    questionText: string;
    points: number;
  };
  answer: string;
  onAnswerChange: (answer: string) => void;
}

const SAQQuestion: React.FC<SAQQuestionProps> = ({ answer, onAnswerChange }) => {
  return (
    <div className="space-y-4">
      <Textarea
        value={answer || ""}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Type your answer here..."
        className="min-h-[120px] text-base"
        rows={4}
      />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Provide a concise answer. Spelling and case sensitivity will be considered.
      </p>
    </div>
  );
};

export default SAQQuestion;
