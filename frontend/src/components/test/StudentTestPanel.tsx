import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Clock,
  Target,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Calendar,
  Sparkles,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllTests, getUserAttempts } from "@/lib/testService";
import UserStats from "./UserStats";
import LoadingScreen from "@/components/LoadingScreen";

interface CourseInfo {
  _id: string;
  courseName: string;
}

interface TestData {
  testId: string;
  title: string;
  description: string;
  course: CourseInfo | string | null;
  duration: number; // minutes
  totalPoints: number;
  passingScore: number; // percentage
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: string;
  maxAttempts: number;
  allowRetake: boolean;
  questions: any[];
}

interface AttemptData {
  attemptId: string;
  test: {
    _id: string;
    title: string;
    description: string;
  } | string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  createdAt: string;
}

const StudentTestPanel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<TestData[]>([]);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [testsRes, attemptsRes] = await Promise.all([
        getAllTests({ status: "PUBLISHED" }),
        getUserAttempts()
      ]);
      setTests(testsRes || []);
      setAttempts(attemptsRes || []);
    } catch (error) {
      console.error("Failed to load test dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttemptsForTest = (testId: string) => {
    return attempts.filter((a) => {
      if (!a.test) return false;
      const attemptTestId = typeof a.test === "object" ? a.test._id : a.test;
      return attemptTestId === testId;
    });
  };

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/50";
      case "INTERMEDIATE":
        return "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50";
      case "ADVANCED":
        return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/50";
    }
  };

  const getDifficultyHeader = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "from-teal-500 to-emerald-600";
      case "INTERMEDIATE":
        return "from-blue-500 to-indigo-600";
      case "ADVANCED":
        return "from-pink-500 to-rose-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d16] p-4 md:p-8 space-y-8 font-ubuntu text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Banner / Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-6 md:p-10 shadow-xl dark:shadow-indigo-950/20">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-xl">
            <Badge className="bg-white/20 text-white border-none hover:bg-white/30 px-3 py-1 flex items-center gap-1.5 w-fit">
              <Sparkles className="h-3 w-3 text-yellow-300 animate-spin" />
              Test Portal Active
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-ubuntu">
              Assess & Certify Your Skills
            </h1>
            <p className="text-blue-100/90 text-sm md:text-base font-normal font-ubuntu">
              Complete course-associated assessments to earn verifiable professional certificates and badges.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate("/user/marksheet")}
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-md transition-all duration-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Marksheets
            </Button>
            <Button 
              onClick={() => navigate("/user/leaderboard")}
              variant="outline"
              className="bg-transparent border-white/40 text-white hover:bg-white/10 font-semibold transition-all duration-300"
            >
              <Trophy className="h-4 w-4 mr-2 text-yellow-300" />
              Leaderboard
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-fit bg-slate-100 dark:bg-slate-900 border dark:border-slate-800/80 p-1">
          <TabsTrigger value="available">Available Tests</TabsTrigger>
          <TabsTrigger value="stats">My Stats & Badges</TabsTrigger>
          <TabsTrigger value="history">Attempt History</TabsTrigger>
        </TabsList>

        {/* Tab 1: Available Tests */}
        <TabsContent value="available" className="space-y-6 outline-none">
          {tests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => {
                const testAttempts = getAttemptsForTest(test.testId);
                const attemptsMade = testAttempts.length;
                const attemptsRemaining = Math.max(0, test.maxAttempts - attemptsMade);
                const isPassed = testAttempts.some((a) => a.passed);
                const bestScore = testAttempts.reduce((max, a) => Math.max(max, a.percentage), 0);
                
                let actionText = "Start Test";
                let isActionDisabled = false;
                
                if (isPassed && !test.allowRetake) {
                  actionText = "Passed";
                  isActionDisabled = true;
                } else if (attemptsRemaining === 0) {
                  actionText = "No Attempts Left";
                  isActionDisabled = true;
                } else if (attemptsMade > 0) {
                  actionText = "Retake Test";
                }

                return (
                  <motion.div
                    key={test.testId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-full flex flex-col justify-between overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1420]">
                      <div>
                        {/* Decorative Top Border */}
                        <div className={`h-2 bg-gradient-to-r ${getDifficultyHeader(test.difficulty)}`} />
                        
                        <CardHeader className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={`${getDifficultyStyles(test.difficulty)} border`} variant="outline">
                              {test.difficulty}
                            </Badge>
                            <Badge 
                              className={
                                isPassed 
                                  ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 hover:bg-emerald-500/10 border-none" 
                                  : attemptsMade > 0 
                                    ? "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 hover:bg-rose-500/10 border-none" 
                                    : "bg-slate-500/10 text-slate-500 dark:bg-slate-500/20 hover:bg-slate-500/10 border-none"
                              }
                            >
                              {isPassed ? "Passed" : attemptsMade > 0 ? "Failed" : "Not Attempted"}
                            </Badge>
                          </div>
                          
                          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {test.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                            {test.description}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-4 pt-0">
                          {/* Course Name */}
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Associated Course</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-right line-clamp-1">
                              {typeof test.course === "object" && test.course ? test.course.courseName : "General Assessment"}
                            </span>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Clock className="h-4 w-4 text-blue-500" />
                              <span>{test.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <BookOpen className="h-4 w-4 text-emerald-500" />
                              <span>{test.questions ? test.questions.length : 0} Questions</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Target className="h-4 w-4 text-purple-500" />
                              <span>{test.totalPoints} total points</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span>Passing Score: {test.passingScore}%</span>
                            </div>
                          </div>

                          {/* Progress on attempts */}
                          {test.maxAttempts > 1 && (
                            <div className="space-y-1.5 pt-2">
                              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>Attempts Used</span>
                                <span className="font-semibold">
                                  {attemptsMade} / {test.maxAttempts}
                                </span>
                              </div>
                              <Progress value={(attemptsMade / test.maxAttempts) * 100} className="h-1 bg-slate-200 dark:bg-slate-800" />
                            </div>
                          )}
                        </CardContent>
                      </div>

                      <CardContent className="pt-0 pb-4">
                        {attemptsMade > 0 && (
                          <div className="mb-3 flex justify-between text-xs items-center bg-blue-500/5 px-2.5 py-1.5 rounded border border-blue-500/10">
                            <span className="text-slate-500 dark:text-slate-400">Your Best Score</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {bestScore.toFixed(0)}%
                            </span>
                          </div>
                        )}
                        <Button 
                          onClick={() => navigate(`/user/test/${test.testId}`)}
                          disabled={isActionDisabled}
                          className={`w-full py-2.5 font-bold transition-all duration-300 ${
                            isPassed 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-100" 
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {!isActionDisabled && <Play className="h-4 w-4 mr-2 fill-current" />}
                          {actionText}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="py-16 text-center space-y-4">
                <BookOpen className="h-16 w-16 mx-auto text-slate-400 opacity-50" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  No Tests Available
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  There are no assessments assigned to you at the moment. Assessments will appear here once published by your instructors.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: My Stats & Achievements */}
        <TabsContent value="stats" className="outline-none">
          <UserStats />
        </TabsContent>

        {/* Tab 3: Attempt History */}
        <TabsContent value="history" className="space-y-6 outline-none">
          {attempts.length > 0 ? (
            <div className="overflow-hidden border dark:border-slate-800 rounded-xl bg-white dark:bg-[#0e1420] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b dark:border-slate-800">
                    <tr>
                      <th scope="col" className="px-6 py-4">Test Title</th>
                      <th scope="col" className="px-6 py-4 text-center">Attempt #</th>
                      <th scope="col" className="px-6 py-4 text-center">Score</th>
                      <th scope="col" className="px-6 py-4 text-center">Percentage</th>
                      <th scope="col" className="px-6 py-4 text-center">Status</th>
                      <th scope="col" className="px-6 py-4">Date Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                    {attempts.map((attempt) => (
                      <tr 
                        key={attempt.attemptId} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                          {typeof attempt.test === "object" && attempt.test ? attempt.test.title : "Assessment"}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                          {attempt.attemptNumber}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {attempt.score} / {attempt.totalPoints}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-slate-100">
                          {attempt.percentage.toFixed(0)}%
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {attempt.passed ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2.5 py-1">
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Passed
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/10 text-rose-500 border-none px-2.5 py-1">
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 opacity-70" />
                            {formatDate(attempt.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="py-16 text-center space-y-4">
                <AlertCircle className="h-16 w-16 mx-auto text-slate-400 opacity-50" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  No Attempt History
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  You haven't started any tests yet. Go to the "Available Tests" tab to start your first assessment.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentTestPanel;
