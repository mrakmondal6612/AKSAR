import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, TrendingUp, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLeaderboard } from "@/lib/testService";
import LoadingScreen from "@/components/LoadingScreen";

interface LeaderboardEntry {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    userName: string;
    profileImageUrl: string;
  };
  test: {
    title: string;
  };
  course: {
    courseName: string;
  };
  score: number;
  percentage: number;
  grade: string;
  rank?: number;
  completionDate: string;
}

const Leaderboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "test" | "course">("all");

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard(undefined, undefined, 20);
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="text-lg font-semibold text-slate-600 dark:text-slate-400">#{rank}</span>;
  };

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

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = "/user/dashboard"}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Leaderboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Top performers across all tests
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            All Time
          </Button>
          <Button
            variant={filter === "test" ? "default" : "outline"}
            onClick={() => setFilter("test")}
            size="sm"
          >
            By Test
          </Button>
          <Button
            variant={filter === "course" ? "default" : "outline"}
            onClick={() => setFilter("course")}
            size="sm"
          >
            By Course
          </Button>
        </div>

        {/* Leaderboard */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry._id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700"
                      : index === 1
                      ? "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border border-gray-300 dark:border-gray-700"
                      : index === 2
                      ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-300 dark:border-amber-700"
                      : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {entry.user?.firstName?.[0] || "?"}{entry.user?.lastName?.[0] || "?"}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {entry.user?.firstName || "Unknown"} {entry.user?.lastName || ""}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        @{entry.user?.userName || "unknown"}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {entry.percentage.toFixed(0)}%
                    </div>
                    <Badge className={getGradeColor(entry.grade)} variant="outline">
                      {entry.grade}
                    </Badge>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Award className="h-4 w-4" />
                    <span className="font-semibold">{Math.round(entry.score * 10)} pts</span>
                  </div>
                </div>
              ))}

              {leaderboard.length === 0 && (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
