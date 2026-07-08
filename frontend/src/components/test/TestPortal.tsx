import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTestForAttempt, startTestAttempt, submitTestAttempt } from "@/lib/testService";
import MCQQuestion from "./MCQQuestion";
import SAQQuestion from "./SAQQuestion";
import TestResults from "./TestResults";
import LoadingScreen from "@/components/LoadingScreen";

interface Question {
  questionId: string;
  questionText: string;
  questionType: "MCQ" | "SAQ";
  options?: string[];
  points: number;
  order: number;
}

interface TestData {
  testId: string;
  title: string;
  description: string;
  duration: number;
  totalPoints: number;
  passingScore: number;
  difficulty: string;
  instructions: string;
  questions: Question[];
  attemptNumber: number;
}

const TestPortal: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTest();
  }, [testId]);

  useEffect(() => {
    if (timeRemaining > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResults]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const test = await getTestForAttempt(testId!);
      setTestData(test);
      setTimeRemaining(test.duration * 60);
      
      // Start attempt
      const attempt = await startTestAttempt(testId!);
      setAttemptId(attempt.attemptId);
    } catch (err: any) {
      setError(err.message || "Failed to load test");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (testData && currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId || !testData) return;

    try {
      setLoading(true);
      
      // Prepare answers with time spent
      const answersArray = testData.questions.map((q) => ({
        questionId: q.questionId,
        selectedAnswer: answers[q.questionId] || "",
        timeSpent: Math.floor(Math.random() * 60), // Simplified time tracking
      }));

      const result = await submitTestAttempt(attemptId, answersArray);
      setResults(result);
      setShowResults(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit test");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    if (!testData) return 0;
    const answered = Object.keys(answers).length;
    return (answered / testData.questions.length) * 100;
  };

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  if (showResults && results) {
    return <TestResults results={results} onBack={() => navigate("/dashboard")} />;
  }
  if (!testData) return null;

  const currentQuestion = testData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === testData.questions.length - 1;
  const isAnswered = answers[currentQuestion.questionId] !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {testData.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Question {currentQuestionIndex + 1} of {testData.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Progress</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(getProgress())}%
              </span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">
                {currentQuestion.questionText}
              </CardTitle>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {currentQuestion.points} pts
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {currentQuestion.questionType === "MCQ" ? (
              <MCQQuestion
                question={currentQuestion}
                answer={answers[currentQuestion.questionId] as string[]}
                onAnswerChange={(answer: string | string[]) => handleAnswerChange(currentQuestion.questionId, answer)}
              />
            ) : (
              <SAQQuestion
                question={currentQuestion}
                answer={answers[currentQuestion.questionId] as string}
                onAnswerChange={(answer: string) => handleAnswerChange(currentQuestion.questionId, answer)}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {testData.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-blue-600 text-white"
                    : answers[testData.questions[index].questionId]
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!isAnswered}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              Submit Test
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isAnswered}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Instructions */}
        {testData.instructions && (
          <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Instructions
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
                {testData.instructions}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestPortal;
