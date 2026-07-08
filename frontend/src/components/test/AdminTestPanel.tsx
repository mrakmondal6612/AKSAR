import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  Award, 
  TrendingUp, 
  Settings,
  Shield,
  Trash2,
  Edit,
  Eye,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getAllTestStats, 
  manageTestStatus, 
  bulkDeleteTests,
  revokeCertificate,
  updateGamificationSettings
} from "@/lib/testService";
import LoadingScreen from "@/components/LoadingScreen";

const AdminTestPanel = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getAllTestStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (testId: string, status: string) => {
    try {
      await manageTestStatus(testId, status);
      loadStats();
    } catch (error) {
      console.error("Failed to update test status:", error);
    }
  };

  const handleBulkDelete = async (testIds: string[]) => {
    if (confirm(`Are you sure you want to delete ${testIds.length} tests?`)) {
      try {
        await bulkDeleteTests(testIds);
        loadStats();
      } catch (error) {
        console.error("Failed to delete tests:", error);
      }
    }
  };

  const handleRevokeCert = async (marksheetId: string) => {
    if (confirm("Are you sure you want to revoke this certificate?")) {
      try {
        await revokeCertificate(marksheetId);
        loadStats();
      } catch (error) {
        console.error("Failed to revoke certificate:", error);
      }
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <motion.div
      className="dark:bg-white/5 bg-black/5 rounded-lg p-6 shadow-2xl dark:shadow-sm dark:shadow-white border-2 dark:border-white border-black"
      variants={{
        hidden: { opacity: 0.3, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Test Administration
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage tests, marksheets, and gamification
            </p>
          </div>
          <Button onClick={loadStats} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="marksheets">Marksheets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Tests</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats?.overview?.totalTests || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Published</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats?.overview?.publishedTests || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Attempts</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats?.overview?.totalAttempts || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Certificates</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats?.overview?.totalMarksheets || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.recentTests?.map((test: any) => (
                      <div key={test.testId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {test.title}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {test.questions?.length || 0} questions
                          </div>
                        </div>
                        <Badge
                          className={
                            test.status === "PUBLISHED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }
                          variant="outline"
                        >
                          {test.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.recentAttempts?.map((attempt: any) => (
                      <div key={attempt.attemptId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {attempt.user?.firstName} {attempt.user?.lastName}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {attempt.test?.title}
                          </div>
                        </div>
                        <Badge
                          className={
                            attempt.passed
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }
                          variant="outline"
                        >
                          {attempt.passed ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tests Management Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentTests?.map((test: any) => (
                    <div key={test.testId} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {test.title}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {test.questions?.length || 0} questions • {test.duration} mins • {test.difficulty}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={test.status}
                          onChange={(e) => handleStatusChange(test.testId, e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBulkDelete([test.testId])}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marksheets Management Tab */}
          <TabsContent value="marksheets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Marksheet Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentAttempts?.filter((a: any) => a.status === "COMPLETED").map((attempt: any) => (
                    <div key={attempt.attemptId} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {attempt.user?.firstName} {attempt.user?.lastName}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {attempt.test?.title} • {attempt.percentage?.toFixed(0)}% • Grade: {attempt.grade}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            attempt.passed
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }
                          variant="outline"
                        >
                          {attempt.passed ? "Passed" : "Failed"}
                        </Badge>
                        {attempt.passed && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeCert(attempt.attemptId)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gamification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Point Multiplier
                  </label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Points earned per score point (default: 10)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Enable Leaderboard
                  </label>
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Badge Thresholds
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400">First Test</label>
                      <input type="number" defaultValue="1" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400">Champion</label>
                      <input type="number" defaultValue="5" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400">Master</label>
                      <input type="number" defaultValue="10" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400">High Achiever</label>
                      <input type="number" defaultValue="90" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    </div>
                  </div>
                </div>

                <Button onClick={() => updateGamificationSettings({})} className="w-full">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default AdminTestPanel;
