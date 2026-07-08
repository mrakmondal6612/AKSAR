import React, { useState, useEffect } from "react";
import { Award, Target, TrendingUp, BookOpen, Star, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getUserStats } from "@/lib/testService";

interface UserStatsData {
  totalTests: number;
  passedTests: number;
  totalPoints: number;
  averagePercentage: number;
  passRate: number;
  badges: string[];
}

const UserStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStatsData | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getUserStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "First Test Passed":
        return <Star className="h-5 w-5" />;
      case "Test Champion":
        return <Award className="h-5 w-5" />;
      case "Test Master":
        return <Target className="h-5 w-5" />;
      case "High Achiever":
        return <TrendingUp className="h-5 w-5" />;
      case "Point Collector":
        return <Zap className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "First Test Passed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700";
      case "Test Champion":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700";
      case "Test Master":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700";
      case "High Achiever":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700";
      case "Point Collector":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-300 dark:border-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8 text-slate-600 dark:text-slate-400">
        No stats available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Tests</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalTests}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Passed</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.passedTests}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Points</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalPoints}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Avg Score</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.averagePercentage}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pass Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pass Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Overall Pass Rate</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {stats.passRate}%
              </span>
            </div>
            <Progress value={stats.passRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Achievements & Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.badges.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {stats.badges.map((badge, index) => (
                <Badge
                  key={index}
                  className={`flex items-center gap-2 px-4 py-2 text-sm ${getBadgeColor(badge)}`}
                  variant="outline"
                >
                  {getBadgeIcon(badge)}
                  {badge}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Complete tests to earn badges!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStats;
