import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Download, Calendar, Award, TrendingUp, Filter, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserMarksheets } from "@/lib/testService";
import LoadingScreen from "@/components/LoadingScreen";

interface Marksheet {
  _id: string;
  marksheetId: string;
  user: string;
  test?: {
    title: string;
    description: string;
    difficulty: string;
  } | null;
  course?: {
    courseName: string;
    thumbnail: string;
  } | null;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  grade: string;
  rank?: number;
  percentile?: number;
  completionDate: string;
  pointsEarned: number;
  certificateUrl?: string;
  certificateStatus: string;
}

const MarksheetPortal: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [marksheets, setMarksheets] = useState<Marksheet[]>([]);
  const [filter, setFilter] = useState<"all" | "passed" | "failed">("all");

  useEffect(() => {
    loadMarksheets();
  }, [filter]);

  const loadMarksheets = async () => {
    try {
      setLoading(true);
      const data = await getUserMarksheets();
      console.log("Marksheets data received:", data);
      
      let filtered = data;
      if (filter === "passed") {
        filtered = data.filter((m: Marksheet) => m.passed);
      } else if (filter === "failed") {
        filtered = data.filter((m: Marksheet) => !m.passed);
      }
      
      setMarksheets(filtered);
    } catch (error) {
      console.error("Failed to load marksheets:", error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-4">
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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              My Marksheets
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              View your test results and download certificates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Results</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>
        </div>

        {/* Marksheets Grid */}
        {marksheets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marksheets.map((marksheet) => (
              <Card key={marksheet._id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {marksheet.test?.title ?? marksheet.course?.courseName ?? "Certificate"}
                      </CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {marksheet.course?.courseName ?? ""}
                      </p>
                    </div>
                    <Badge className={getGradeColor(marksheet.grade)} variant="outline">
                      {marksheet.grade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Score</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {marksheet.percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        marksheet.passed ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${marksheet.percentage}%` }}
                    />
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Award className="h-4 w-4" />
                      <span>{marksheet.pointsEarned} pts</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <TrendingUp className="h-4 w-4" />
                      <span>#{marksheet.rank || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(marksheet.completionDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="font-medium">
                        {marksheet.score}/{marksheet.totalPoints}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        console.log("Navigating to marksheet:", marksheet.marksheetId);
                        navigate(`/user/marksheet/${marksheet.marksheetId}`);
                      }}
                    >
                      View Details
                    </Button>
                    {marksheet.passed && (
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate(`/user/marksheet/${marksheet.marksheetId}`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Certificate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No marksheets yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Complete a test to see your results here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarksheetPortal;
