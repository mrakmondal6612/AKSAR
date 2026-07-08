import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Award, Clock, CheckCircle, XCircle, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TestResultsProps {
  results: {
    attempt: any;
    marksheet: any;
  };
  onBack: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({ results, onBack }) => {
  const navigate = useNavigate();
  const { attempt, marksheet } = results;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "C":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "D":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Test Completed!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {attempt.passed ? "Congratulations! You passed the test." : "Keep practicing! You'll do better next time."}
          </p>
        </div>

        {/* Score Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score */}
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-slate-900 dark:text-slate-100">
                  {attempt.percentage.toFixed(0)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Score</div>
              </div>

              {/* Grade */}
              <div className="text-center space-y-2">
                <Badge className={`text-2xl px-6 py-2 ${getGradeColor(marksheet.grade)}`}>
                  {marksheet.grade}
                </Badge>
                <div className="text-sm text-slate-600 dark:text-slate-400">Grade</div>
              </div>

              {/* Points */}
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {marksheet.pointsEarned}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                  <Award className="h-4 w-4" />
                  Points Earned
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {attempt.score}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {attempt.totalPoints - attempt.score}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Incorrect</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatTime(attempt.timeSpent)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Time
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  #{marksheet.rank || "-"}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer Review */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Answer Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attempt.answers.map((answer: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  answer.isCorrect
                    ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
                    : "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                      Question {index + 1}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Points: {answer.pointsEarned}/{answer.pointsEarned > 0 ? answer.pointsEarned : 0}
                    </div>
                  </div>
                  <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                    {answer.isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
            Back to Dashboard
          </Button>
          {marksheet.passed && (
            <Button
              onClick={() => navigate(`/marksheet/${marksheet.marksheetId}`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              View Certificate
            </Button>
          )}
          <Button
            onClick={() => navigate(`/leaderboard/${attempt.test}`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            View Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
