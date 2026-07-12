import { useState, useEffect } from "react";
import { 
  FileText, 
  TrendingUp, 
  Trash2,
  Users,
  CheckCircle,
  Clock,
  Search,
  Edit,
  Plus,
  Calendar,
  Award,
  BarChart3,
  Settings,
  RefreshCw,
  ShieldAlert,
  Sliders,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  getAllAttemptsAdmin,
  deleteAttemptAdmin,
  getAllTestStats,
  getAllTests,
  manageTestStatus,
  deleteTest,
  bulkDeleteTests,
  getAllMarksheetsAdmin,
  revokeCertificate,
  updateGamificationSettings,
  autoAssignTest,
  getAllActiveCourses,
  createAttemptAdmin,
  updateAttemptAdmin
} from "@/lib/testService";
import LoadingScreen from "@/components/LoadingScreen";
import { USER_API } from "@/lib/env";
import { getVerifiedToken } from "@/lib/cookieService";
import axios from "axios";
import { SuccessToast, ErrorToast } from "@/lib/toasts";

const AdminTestPanel = () => {
  // Global / Loading states
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Stats State
  const [stats, setStats] = useState<any>(null);

  // All Tests State
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [testSearch, setTestSearch] = useState("");
  const [testStatusFilter, setTestStatusFilter] = useState("ALL");

  // Test Attempts State
  const [attempts, setAttempts] = useState<any>(null);
  const [attemptSearch, setAttemptSearch] = useState("");
  const [attemptStatusFilter, setAttemptStatusFilter] = useState("ALL");

  // Attempts CRUD Modal States
  const [showCreateAttemptModal, setShowCreateAttemptModal] = useState(false);
  const [showEditAttemptModal, setShowEditAttemptModal] = useState(false);
  const [selectedAttemptToEdit, setSelectedAttemptToEdit] = useState<any>(null);

  // Attempts CRUD Form States
  const [createAttemptForm, setCreateAttemptForm] = useState({
    targetUserId: "",
    testId: "",
    status: "COMPLETED",
    score: 0,
    totalPoints: 100,
    attemptNumber: 1
  });

  const [editAttemptForm, setEditAttemptForm] = useState({
    status: "COMPLETED",
    score: 0,
    totalPoints: 100,
    attemptNumber: 1
  });

  // Certificates State
  const [marksheets, setMarksheets] = useState<any[]>([]);
  const [marksheetSearch, setMarksheetSearch] = useState("");
  const [marksheetStatusFilter, setMarksheetStatusFilter] = useState("ALL");
  const [marksheetPage, setMarksheetPage] = useState(1);
  const [marksheetTotalPages, setMarksheetTotalPages] = useState(1);
  const [totalMarksheetsCount, setTotalMarksheetsCount] = useState(0);

  // Auto Assign State
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Gamification State
  const [gamificationForm, setGamificationForm] = useState({
    pointMultiplier: 10,
    badgeThresholds: {
      firstTest: 1,
      champion: 5,
      master: 10,
      highAchiever: 90,
      pointCollector: 1000,
    },
    enableLeaderboard: true,
  });
  const [savingGamification, setSavingGamification] = useState(false);

  // Analytics Modals / Details Modals
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Init loads
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Tab Switch Actions
  useEffect(() => {
    console.log("[AdminPanel] Active tab changed to:", activeTab);
    if (activeTab === "tests") {
      loadAllTests();
    } else if (activeTab === "attempts") {
      loadAttempts();
      loadAllTests(); // Preload tests for manual creation dropdown
      loadStudentsList(); // Preload students for manual creation dropdown
    } else if (activeTab === "certificates") {
      loadCertificates();
    } else if (activeTab === "auto-assign") {
      console.log("[AdminPanel] Loading auto-assign options...");
      loadAutoAssignOptions();
    }
  }, [activeTab, marksheetPage]);

  // Loaders
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getAllTestStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTests = async () => {
    try {
      setLoading(true);
      const data = await getAllTests();
      setTests(data || []);
    } catch (error) {
      console.error("Failed to fetch all tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const data = await getAllAttemptsAdmin({ limit: 100 });
      setAttempts(data);
    } catch (error) {
      console.error("Failed to load attempts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsList = async () => {
    try {
      const token = getVerifiedToken();
      console.log("[AdminPanel] Fetching students from:", `${USER_API}/admin/students?limit=100`);
      console.log("[AdminPanel] Token exists:", !!token);
      
      if (!token) {
        ErrorToast("Authentication required. Please login again.");
        return;
      }
      
      const response = await axios.get(`${USER_API}/admin/students?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("[AdminPanel] Student fetch response:", response.data);
      console.log("[AdminPanel] Student data array:", response.data?.data);
      if (response.data?.success) {
        setStudents(response.data.data || []);
        console.log("[AdminPanel] Students state updated with:", response.data.data?.length, "students");
      } else {
        console.error("[AdminPanel] Student fetch returned success:false");
        ErrorToast(response.data?.message || "Failed to load students");
      }
    } catch (error: any) {
      console.error("[AdminPanel] Failed to load student list:", error);
      console.error("[AdminPanel] Error response:", error.response?.data);
      console.error("[AdminPanel] Error status:", error.response?.status);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        ErrorToast("Access denied. You need Admin or Instructor privileges to view students.");
      } else {
        ErrorToast(error.response?.data?.message || "Failed to load students");
      }
    }
  };

  const loadCertificates = async () => {
    try {
      setLoading(true);
      let statusParam = undefined;
      if (marksheetStatusFilter === "PASSED") statusParam = "passed";
      if (marksheetStatusFilter === "FAILED") statusParam = "failed";

      const data = await getAllMarksheetsAdmin({
        page: marksheetPage,
        limit: 10,
        status: statusParam,
      });

      if (data) {
        setMarksheets(data.marksheets || []);
        setMarksheetTotalPages(data.pagination?.pages || 1);
        setTotalMarksheetsCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to load certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAutoAssignOptions = async () => {
    try {
      setLoading(true);

      // Load active courses first
      try {
        console.log("[AdminPanel] Initiating active courses fetch...");
        const courseList = await getAllActiveCourses();
        console.log("[AdminPanel] Courses fetched list:", courseList);
        console.log("[AdminPanel] Course list length:", courseList?.length);
        setCourses(courseList || []);
        console.log("[AdminPanel] Courses state updated");
        if (!courseList || courseList.length === 0) {
          ErrorToast("No courses available. Please create courses first.");
        } else {
          SuccessToast(`Loaded ${courseList.length} courses`);
        }
      } catch (courseError: any) {
        console.error("[AdminPanel] Failed to load courses inside auto-assign option loader:", courseError);
        console.error("[AdminPanel] Course error response:", courseError.response?.data);
        setCourses([]);
        ErrorToast(courseError.response?.data?.message || "Failed to load courses");
      }

      // Load student list
      try {
        console.log("[AdminPanel] Loading student list for auto-assign...");
        await loadStudentsList();
      } catch (studentError) {
        console.error("[AdminPanel] Failed to load student list inside auto-assign option loader:", studentError);
        setStudents([]);
      }
    } catch (error) {
      console.error("[AdminPanel] Failed to load auto-assignment dropdown options:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test Actions
  const handleTestStatusChange = async (testId: string, newStatus: string) => {
    try {
      await manageTestStatus(testId, newStatus);
      loadAllTests();
    } catch (error) {
      console.error("Failed to change test status:", error);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (confirm("Are you sure you want to delete this test? All questions and associated history will be deleted.")) {
      try {
        await deleteTest(testId);
        loadAllTests();
      } catch (error) {
        console.error("Failed to delete test:", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    const testIds = Array.from(selectedTests);
    if (testIds.length === 0) return;
    
    if (confirm(`Are you sure you want to delete the ${testIds.length} selected tests?`)) {
      try {
        await bulkDeleteTests(testIds);
        setSelectedTests(new Set());
        loadAllTests();
      } catch (error) {
        console.error("Failed to bulk delete tests:", error);
      }
    }
  };

  const toggleSelectTest = (testId: string) => {
    const updated = new Set(selectedTests);
    if (updated.has(testId)) {
      updated.delete(testId);
    } else {
      updated.add(testId);
    }
    setSelectedTests(updated);
  };

  const toggleSelectAllTests = () => {
    if (selectedTests.size === filteredTests.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(filteredTests.map(t => t.testId)));
    }
  };

  // Attempts CRUD Actions
  const handleCreateAttemptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createAttemptForm.targetUserId || !createAttemptForm.testId) {
      ErrorToast("Please select both a student and a test");
      return;
    }
    try {
      setLoading(true);
      await createAttemptAdmin(createAttemptForm);
      setShowCreateAttemptModal(false);
      setCreateAttemptForm({
        targetUserId: "",
        testId: "",
        status: "COMPLETED",
        score: 0,
        totalPoints: 100,
        attemptNumber: 1
      });
      loadAttempts();
    } catch (error) {
      console.error("Failed to manually build attempt:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAttemptClick = (attempt: any) => {
    setSelectedAttemptToEdit(attempt);
    setEditAttemptForm({
      status: attempt.status,
      score: attempt.score || 0,
      totalPoints: attempt.totalPoints || 100,
      attemptNumber: attempt.attemptNumber || 1
    });
    setShowEditAttemptModal(true);
  };

  const handleEditAttemptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttemptToEdit) return;
    try {
      setLoading(true);
      await updateAttemptAdmin(selectedAttemptToEdit.attemptId, editAttemptForm);
      setShowEditAttemptModal(false);
      setSelectedAttemptToEdit(null);
      loadAttempts();
    } catch (error) {
      console.error("Failed to save attempt configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    if (confirm("Are you sure you want to delete this attempt? This will also delete the associated marksheet.")) {
      try {
        await deleteAttemptAdmin(attemptId);
        loadAttempts();
      } catch (error) {
        console.error("Failed to delete attempt:", error);
      }
    }
  };

  // Certificates Actions
  const handleRevokeCertificate = async (marksheetId: string) => {
    if (confirm("Are you sure you want to revoke this certificate? The verification status will show as REVOKED.")) {
      try {
        await revokeCertificate(marksheetId);
        loadCertificates();
        SuccessToast("Certificate status revoked successfully");
      } catch (error) {
        console.error("Failed to revoke certificate:", error);
      }
    }
  };

  // Auto Assign Action
  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedStudent) {
      ErrorToast("Please select both a course and a student");
      return;
    }

    try {
      setAssigning(true);
      await autoAssignTest(selectedCourse, selectedStudent);
      setSelectedCourse("");
      setSelectedStudent("");
    } catch (error) {
      console.error("Failed to assign test:", error);
    } finally {
      setAssigning(false);
    }
  };

  // Gamification Settings Action
  const handleSaveGamification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGamification(true);
      await updateGamificationSettings(gamificationForm);
      loadDashboardData();
    } catch (error) {
      console.error("Failed to save gamification settings:", error);
    } finally {
      setSavingGamification(false);
    }
  };

  // Filters
  const filteredTests = tests.filter((test: any) => {
    const courseName = typeof test.course === 'object' ? test.course.courseName : test.course;
    const matchesSearch = test.title?.toLowerCase().includes(testSearch.toLowerCase()) ||
                          courseName?.toLowerCase().includes(testSearch.toLowerCase());
    const matchesStatus = testStatusFilter === "ALL" || test.status === testStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAttempts = (attempts?.attempts || attempts || []).filter((attempt: any) => {
    const matchesSearch = 
      attempt.user?.firstName?.toLowerCase().includes(attemptSearch.toLowerCase()) ||
      attempt.user?.lastName?.toLowerCase().includes(attemptSearch.toLowerCase()) ||
      attempt.user?.email?.toLowerCase().includes(attemptSearch.toLowerCase()) ||
      attempt.test?.title?.toLowerCase().includes(attemptSearch.toLowerCase());
    const matchesStatus = attemptStatusFilter === "ALL" || attempt.status === attemptStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredMarksheets = marksheets.filter((marksheet: any) => {
    const matchesSearch = 
      marksheet.user?.firstName?.toLowerCase().includes(marksheetSearch.toLowerCase()) ||
      marksheet.user?.lastName?.toLowerCase().includes(marksheetSearch.toLowerCase()) ||
      marksheet.user?.email?.toLowerCase().includes(marksheetSearch.toLowerCase()) ||
      marksheet.test?.title?.toLowerCase().includes(marksheetSearch.toLowerCase());
    return matchesSearch;
  });

  // Automatically update max points target on test select for manually created attempts
  const handleCreateAttemptTestChange = (testId: string) => {
    const selectedTestObj = tests.find(t => t.testId === testId);
    setCreateAttemptForm({
      ...createAttemptForm,
      testId,
      totalPoints: selectedTestObj ? selectedTestObj.totalPoints : 100
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div
      className="bg-background text-foreground border border-border rounded-2xl p-6 shadow-2xl transition-colors duration-300"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sliders className="h-6 w-6" />
              </span>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                Test Hub Control Panel
              </h1>
            </div>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Comprehensive administrative portal for test orchestration, certificate validation, and gamification rules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => { 
                loadDashboardData(); 
                if (activeTab === "tests") loadAllTests();
                if (activeTab === "attempts") loadAttempts();
                if (activeTab === "certificates") loadCertificates();
              }} 
              variant="outline"
              className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button 
              onClick={() => window.location.href = "/user/add-tests"}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="bg-card border-border text-card-foreground overflow-hidden relative group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Total Active Tests</p>
                  <p className="text-3xl font-black mt-2 text-foreground">
                    {stats?.overview?.totalTests || 0}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                    <Badge variant="secondary" className="px-1.5 py-0 bg-indigo-100/50 text-indigo-750 dark:bg-indigo-950/50 dark:text-indigo-400 border-0">
                      {stats?.overview?.publishedTests || 0} Published
                    </Badge>
                    <Badge variant="outline" className="px-1.5 py-0 border-border text-foreground">
                      {stats?.overview?.draftTests || 0} Drafts
                    </Badge>
                  </div>
                </div>
                <div className="p-3 bg-indigo-650 text-white rounded-xl shadow-md">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border text-card-foreground overflow-hidden relative group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-650 dark:text-emerald-400 uppercase tracking-wider">Student Attempts</p>
                  <p className="text-3xl font-black mt-2 text-foreground">
                    {stats?.overview?.totalAttempts || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{stats?.overview?.completedAttempts || 0} completed</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border text-card-foreground overflow-hidden relative group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-purple-650 dark:text-purple-400 uppercase tracking-wider">Certs Generated</p>
                  <p className="text-3xl font-black mt-2 text-foreground">
                    {stats?.overview?.totalMarksheets || 0}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Award className="h-3.5 w-3.5 text-purple-500" />
                    <span>{stats?.overview?.passedTests || 0} passes</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-600 text-white rounded-xl shadow-md">
                  <Award className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border text-card-foreground overflow-hidden relative group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-650 dark:text-amber-400 uppercase tracking-wider">Pass Rate Average</p>
                  <p className="text-3xl font-black mt-2 text-foreground">
                    {stats?.overview?.passRate ? stats.overview.passRate.toFixed(1) : 0}%
                  </p>
                  <div className="w-20 bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${stats?.overview?.passRate || 0}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full bg-muted p-1 rounded-xl border border-border overflow-x-auto gap-1">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground transition-all text-xs sm:text-sm font-semibold flex-1 min-w-[120px]">
              <TrendingUp className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tests" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground transition-all text-xs sm:text-sm font-semibold flex-1 min-w-[120px]">
              <FileText className="h-4 w-4 mr-2" />
              Manage Tests
            </TabsTrigger>
            <TabsTrigger value="attempts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground transition-all text-xs sm:text-sm font-semibold flex-1 min-w-[120px]">
              <Users className="h-4 w-4 mr-2" />
              Attempts Log
            </TabsTrigger>
            <TabsTrigger value="certificates" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground transition-all text-xs sm:text-sm font-semibold flex-1 min-w-[120px]">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="auto-assign" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground transition-all text-xs sm:text-sm font-semibold flex-1 min-w-[120px]">
              <Calendar className="h-4 w-4 mr-2" />
              Auto-Assign
            </TabsTrigger>
            <TabsTrigger value="gamification" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground transition-all text-xs sm:text-sm font-semibold flex-1 min-w-[120px]">
              <BarChart3 className="h-4 w-4 mr-2" />
              Gamification
            </TabsTrigger>
          </TabsList>

          {/* 1. Dashboard Overview Tab */}
          <TabsContent value="dashboard" className="space-y-6 focus:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity: Tests */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-card-foreground">Recent Tests Built</CardTitle>
                    <CardDescription className="text-muted-foreground">Recently created test materials across courses</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("tests")} className="text-primary hover:bg-accent hover:text-accent-foreground">
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats?.recentTests?.slice(0, 4).map((test: any) => (
                    <div 
                      key={test.testId} 
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground text-sm">{test.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="capitalize">{test.difficulty?.toLowerCase()}</span>
                          <span>•</span>
                          <span>{test.questions?.length || 0} Questions</span>
                          <span>•</span>
                          <span>{test.duration} mins</span>
                        </div>
                      </div>
                      <Badge className={
                        test.status === "PUBLISHED" 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                      }>
                        {test.status}
                      </Badge>
                    </div>
                  ))}
                  {(!stats?.recentTests || stats.recentTests.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">No recent tests constructed.</div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity: Attempts */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-card-foreground">Recent Test Attempts</CardTitle>
                    <CardDescription className="text-muted-foreground">Live feed of student test submissions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("attempts")} className="text-primary hover:bg-accent hover:text-accent-foreground">
                    View Logs
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats?.recentAttempts?.slice(0, 4).map((attempt: any) => (
                    <div 
                      key={attempt.attemptId} 
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background"
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}` : "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {attempt.test?.title || "Deleted Test"} • {new Date(attempt.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-primary">
                          {attempt.percentage ? attempt.percentage.toFixed(0) : 0}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Score: {attempt.score}/{attempt.totalPoints}</p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentAttempts || stats.recentAttempts.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">No attempts logged yet.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Administration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div 
                onClick={() => setShowAnalyticsModal(true)} 
                className="p-5 rounded-2xl border border-border bg-card cursor-pointer hover:shadow-lg hover:border-emerald-500 dark:hover:border-emerald-700 transition-all group"
              >
                <BarChart3 className="h-7 w-7 text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-foreground text-base">Analytical Breakdown</h3>
                <p className="text-xs text-muted-foreground mt-1">Review system-wide passing rates, average score statistics, and test performance indices.</p>
              </div>

              <div 
                onClick={() => setActiveTab("gamification")}
                className="p-5 rounded-2xl border border-border bg-card cursor-pointer hover:shadow-lg hover:border-purple-500 dark:hover:border-purple-700 transition-all group"
              >
                <Settings className="h-7 w-7 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-foreground text-base">Gamification Configurations</h3>
                <p className="text-xs text-muted-foreground mt-1">Configure user reward point multipliers, badge triggers, and update global leaderboards.</p>
              </div>

              <div 
                onClick={() => setActiveTab("auto-assign")}
                className="p-5 rounded-2xl border border-border bg-card cursor-pointer hover:shadow-lg hover:border-amber-500 dark:hover:border-amber-700 transition-all group"
              >
                <Calendar className="h-7 w-7 text-amber-600 dark:text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-foreground text-base">Student Auto-Assignment</h3>
                <p className="text-xs text-muted-foreground mt-1">Directly enroll or assign specific course examinations to selected student profiles manually.</p>
              </div>
            </div>
          </TabsContent>

          {/* 2. Manage Tests Database Tab */}
          <TabsContent value="tests" className="space-y-6 focus:outline-none">
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-card-foreground">Test Core Database</CardTitle>
                    <CardDescription className="text-muted-foreground">Modify settings, toggle visibility status, or edit test sheets directly</CardDescription>
                  </div>
                  {selectedTests.size > 0 && (
                    <Button 
                      variant="destructive" 
                      onClick={handleBulkDelete}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Bulk Delete ({selectedTests.size})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Search / Filters */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tests by title..."
                      value={testSearch}
                      onChange={(e) => setTestSearch(e.target.value)}
                      className="pl-10 border-border bg-background text-foreground focus-visible:ring-ring"
                    />
                  </div>
                  <select
                    value={testStatusFilter}
                    onChange={(e) => setTestStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                {/* Table grid */}
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border text-xs font-bold text-muted-foreground uppercase">
                        <th className="p-4 w-10">
                          <input 
                            type="checkbox" 
                            checked={filteredTests.length > 0 && selectedTests.size === filteredTests.length} 
                            onChange={toggleSelectAllTests}
                            className="rounded border-input bg-background text-primary"
                          />
                        </th>
                        <th className="p-4">Test Title</th>
                        <th className="p-4">Associated Course ID</th>
                        <th className="p-4">Difficulty</th>
                        <th className="p-4">Configuration</th>
                        <th className="p-4">Publication Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTests.map((test: any) => (
                        <tr key={test.testId} className="hover:bg-accent/40 text-foreground transition-colors">
                          <td className="p-4">
                            <input 
                              type="checkbox" 
                              checked={selectedTests.has(test.testId)}
                              onChange={() => toggleSelectTest(test.testId)}
                              className="rounded border-input bg-background text-primary"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{test.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">ID: {test.testId}</div>
                          </td>
                          <td className="p-4 text-muted-foreground font-medium">
                            {typeof test.course === 'object' ? test.course.courseName : test.course}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={
                              test.difficulty === "BEGINNER" 
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                : test.difficulty === "INTERMEDIATE"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            }>
                              {test.difficulty}
                            </Badge>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            <div className="flex flex-col gap-0.5">
                              <span>Questions: {test.questions?.length || 0}</span>
                              <span>Passing: {test.passingScore}%</span>
                              <span>Points: {test.totalPoints} / Time: {test.duration}m</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <select
                              value={test.status}
                              onChange={(e) => handleTestStatusChange(test.testId, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-md border bg-background text-foreground ${
                                test.status === "PUBLISHED"
                                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : test.status === "DRAFT"
                                  ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              <option value="DRAFT">DRAFT</option>
                              <option value="PUBLISHED">PUBLISHED</option>
                              <option value="ARCHIVED">ARCHIVED</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.location.href = `/user/add-tests?edit=${test.testId}`}
                                className="h-8 w-8 p-0 border-border text-muted-foreground hover:text-primary hover:bg-accent"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteTest(test.testId)}
                                className="h-8 w-8 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredTests.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-muted-foreground">
                            No tests found matching search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Test Attempts Tab */}
          <TabsContent value="attempts" className="space-y-6 focus:outline-none">
            <Card className="bg-card border-border shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-card-foreground">Student Attempts Database</CardTitle>
                    <CardDescription className="text-muted-foreground">Add, view scores, modify, and delete attempt logs</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => setShowCreateAttemptModal(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-1.5 h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Attempt Record
                    </Button>
                    <Badge variant="secondary" className="px-3 py-1 font-semibold text-primary bg-primary/10 h-8 flex items-center border-0">
                      {filteredAttempts.length} attempts listed
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student name, email, or test title..."
                      value={attemptSearch}
                      onChange={(e) => setAttemptSearch(e.target.value)}
                      className="pl-10 border-border bg-background text-foreground"
                    />
                  </div>
                  <select
                    value={attemptStatusFilter}
                    onChange={(e) => setAttemptStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                {/* List layout */}
                <div className="space-y-3">
                  {filteredAttempts.map((attempt: any) => (
                    <div 
                      key={attempt.attemptId} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background rounded-xl border border-border hover:shadow-sm transition-all gap-4 text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold uppercase shadow-inner">
                          {attempt.user?.firstName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {attempt.user ? `${attempt.user.firstName} ${attempt.user.lastName}` : "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{attempt.user?.email || "No Email"}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground sm:flex-1 sm:justify-center">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{attempt.test?.title || "Deleted Test"}</span>
                        </div>
                        <div>•</div>
                        <div>Attempt #{attempt.attemptNumber}</div>
                        <div>•</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{new Date(attempt.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                        <div className="text-left sm:text-right">
                          <div className="text-lg font-black text-foreground">
                            {attempt.percentage ? attempt.percentage.toFixed(0) : 0}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">Score: {attempt.score}/{attempt.totalPoints}</div>
                        </div>
                        <Badge className={
                          attempt.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : attempt.status === "IN_PROGRESS"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        } variant="outline">
                          {attempt.status}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditAttemptClick(attempt)}
                            className="h-8 w-8 p-0 border-border bg-card text-foreground hover:bg-accent"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteAttempt(attempt.attemptId)}
                            className="h-8 w-8 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredAttempts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      <span>No attempt logs matching filters.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Issued Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6 focus:outline-none">
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-card-foreground">Issued Marksheets & Certificates</CardTitle>
                    <CardDescription className="text-muted-foreground">Track verification logs and revoke invalid marksheets</CardDescription>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1 font-semibold text-primary bg-primary/10 border-0">
                    {totalMarksheetsCount} Total Records
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student or test..."
                      value={marksheetSearch}
                      onChange={(e) => setMarksheetSearch(e.target.value)}
                      className="pl-10 border-border bg-background text-foreground"
                    />
                  </div>
                  <select
                    value={marksheetStatusFilter}
                    onChange={(e) => { setMarksheetStatusFilter(e.target.value); setMarksheetPage(1); }}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none"
                  >
                    <option value="ALL">All Marksheets</option>
                    <option value="PASSED">Passed (Passed)</option>
                    <option value="FAILED">Failed (Failed)</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border text-xs font-bold text-muted-foreground uppercase">
                        <th className="p-4">Student</th>
                        <th className="p-4">Test & Course</th>
                        <th className="p-4">Scores</th>
                        <th className="p-4">Completion Date</th>
                        <th className="p-4">Cert Status</th>
                        <th className="p-4 text-right">Revocation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredMarksheets.map((m: any) => (
                        <tr key={m.marksheetId} className="hover:bg-accent/40 text-foreground transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-foreground">
                              {m.user ? `${m.user.firstName} ${m.user.lastName}` : "Deleted User"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{m.user?.email || "No email"}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-foreground">{m.test?.title || "Deleted Test"}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Course: {m.course?.courseName || "Deleted Course"}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-foreground">{m.percentage?.toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Score: {m.score}/{m.totalPoints}</div>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground font-medium">
                            {new Date(m.completionDate).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <Badge className={
                              m.certificateStatus === "REVOKED"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            } variant="outline">
                              {m.certificateStatus || "ISSUED"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            {m.certificateStatus !== "REVOKED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeCertificate(m.marksheetId)}
                                className="text-destructive hover:text-destructive-foreground border-destructive/20 hover:bg-destructive text-xs font-semibold"
                              >
                                <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                                Revoke
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground font-bold italic">Revoked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredMarksheets.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-muted-foreground">
                            No certificates matched.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {marksheetTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border pt-4 mt-4 text-foreground">
                    <div className="text-xs text-muted-foreground font-medium">
                      Page {marksheetPage} of {marksheetTotalPages}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={marksheetPage === 1}
                        onClick={() => setMarksheetPage(prev => Math.max(prev - 1, 1))}
                        className="border-border bg-card text-foreground"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={marksheetPage === marksheetTotalPages}
                        onClick={() => setMarksheetPage(prev => Math.min(prev + 1, marksheetTotalPages))}
                        className="border-border bg-card text-foreground"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Auto-Assignment Tab */}
          <TabsContent value="auto-assign" className="space-y-6 focus:outline-none">
            <Card className="bg-card border-border shadow-md max-w-xl mx-auto">
              <CardHeader>
                <CardTitle className="text-lg text-card-foreground">Auto-Assignment Orchestration</CardTitle>
                <CardDescription className="text-muted-foreground">Deploy examination sheets to specific user profiles instantly.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAssignTest} className="space-y-5">
                  {/* Select Course */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">-- Select Target Course --</option>
                      {courses.map((course) => (
                        <option key={course.courseId} value={course.courseId}>
                          {course.courseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Student */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Student</label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">-- Select Target Student --</option>
                      {students.map((student) => (
                        <option key={student.uniqueId} value={student.uniqueId}>
                          {student.firstName} {student.lastName} ({student.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit */}
                  <Button 
                    type="submit" 
                    disabled={assigning}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg h-10 mt-2"
                  >
                    {assigning ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Deploying Assignment...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Assign Course Examination
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Gamification Settings Tab */}
          <TabsContent value="gamification" className="space-y-6 focus:outline-none">
            <Card className="bg-card border-border shadow-md max-w-xl mx-auto">
              <CardHeader>
                <CardTitle className="text-lg text-card-foreground">Gamification Schema Rules</CardTitle>
                <CardDescription className="text-muted-foreground">Adjust point multipliers, toggle badge milestones, and configure leaderboard visibility</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGamification} className="space-y-6">
                  {/* Point Multiplier */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Base Points Multiplier</label>
                    <Input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={gamificationForm.pointMultiplier}
                      onChange={(e) => setGamificationForm({
                        ...gamificationForm,
                        pointMultiplier: Number(e.target.value)
                      })}
                      className="border-border bg-background text-foreground focus-visible:ring-ring"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Multiplier applied to percentage scores to calculate points earned (e.g. 90% score * 10 multiplier = 900 points).</p>
                  </div>

                  {/* Badge Milestones */}
                  <div className="space-y-4 border-t border-border pt-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Badge Threshold Milestones</label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-xs text-muted-foreground font-semibold">First Test Badge (Attempts)</span>
                        <Input
                          type="number"
                          value={gamificationForm.badgeThresholds.firstTest}
                          onChange={(e) => setGamificationForm({
                            ...gamificationForm,
                            badgeThresholds: {
                              ...gamificationForm.badgeThresholds,
                              firstTest: Number(e.target.value)
                            }
                          })}
                          className="border-border bg-background text-foreground h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs text-muted-foreground font-semibold">Champion Badge (Attempts)</span>
                        <Input
                          type="number"
                          value={gamificationForm.badgeThresholds.champion}
                          onChange={(e) => setGamificationForm({
                            ...gamificationForm,
                            badgeThresholds: {
                              ...gamificationForm.badgeThresholds,
                              champion: Number(e.target.value)
                            }
                          })}
                          className="border-border bg-background text-foreground h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs text-muted-foreground font-semibold">Master Badge (Attempts)</span>
                        <Input
                          type="number"
                          value={gamificationForm.badgeThresholds.master}
                          onChange={(e) => setGamificationForm({
                            ...gamificationForm,
                            badgeThresholds: {
                              ...gamificationForm.badgeThresholds,
                              master: Number(e.target.value)
                            }
                          })}
                          className="border-border bg-background text-foreground h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs text-muted-foreground font-semibold">High Achiever Badge (%)</span>
                        <Input
                          type="number"
                          value={gamificationForm.badgeThresholds.highAchiever}
                          onChange={(e) => setGamificationForm({
                            ...gamificationForm,
                            badgeThresholds: {
                              ...gamificationForm.badgeThresholds,
                              highAchiever: Number(e.target.value)
                            }
                          })}
                          className="border-border bg-background text-foreground h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground font-semibold">Collector Badge (Total Points Target)</span>
                      <Input
                        type="number"
                        value={gamificationForm.badgeThresholds.pointCollector}
                        onChange={(e) => setGamificationForm({
                          ...gamificationForm,
                          badgeThresholds: {
                            ...gamificationForm.badgeThresholds,
                            pointCollector: Number(e.target.value)
                          }
                        })}
                        className="border-border bg-background text-foreground h-9"
                      />
                    </div>
                  </div>

                  {/* Leaderboard status */}
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Public Leaderboards</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Toggle visibility of ranking systems to student panels.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={gamificationForm.enableLeaderboard}
                      onChange={(e) => setGamificationForm({
                        ...gamificationForm,
                        enableLeaderboard: e.target.checked
                      })}
                      className="w-10 h-6 rounded-full accent-primary cursor-pointer"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={savingGamification}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg h-10"
                  >
                    {savingGamification ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Saving Configurations...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Settings className="h-4 w-4" />
                        Save Gamification Rules
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Analytics Modal */}
      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl text-foreground focus:outline-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <BarChart3 className="h-6 w-6 text-primary" />
              Analytical Examination Diagnostics
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">System-wide performance indicators and score logs</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 font-medium">System Pass Rate Avg</p>
                      <p className="text-3xl font-extrabold mt-1">
                        {stats?.overview?.passRate ? Math.round(stats.overview.passRate) : 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 font-medium">Issued Certificates</p>
                      <p className="text-3xl font-extrabold mt-1">{stats?.overview?.totalMarksheets || 0}</p>
                    </div>
                    <Award className="h-10 w-10 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90 font-medium">Active Candidates</p>
                      <p className="text-3xl font-extrabold mt-1">{stats?.overview?.totalAttempts || 0}</p>
                    </div>
                    <Users className="h-10 w-10 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base text-card-foreground">Comprehensive Performance Index</CardTitle>
                <CardDescription className="text-muted-foreground">Average evaluation values across recently evaluated exams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentTests?.map((test: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border"
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">{test.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{test.attempts || 0} candidate attempts registered</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {Math.round(test.averageScore || 0)}% avg
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {Math.round((test.passRate || 0) * 100)}% passing rate
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentTests || stats.recentTests.length === 0) && (
                    <p className="text-center text-muted-foreground py-6">No performance indexes recorded yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attempts CRUD: Create Attempt Modal */}
      <Dialog open={showCreateAttemptModal} onOpenChange={setShowCreateAttemptModal}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-2xl text-foreground focus:outline-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Create Student Attempt Record</DialogTitle>
            <DialogDescription className="text-muted-foreground">Manually insert a test attempt history record for a student.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAttemptSubmit} className="space-y-4 mt-2">
            {/* Student Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Student</label>
              <select
                value={createAttemptForm.targetUserId}
                onChange={(e) => setCreateAttemptForm({ ...createAttemptForm, targetUserId: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Select Student --</option>
                {students.map((student) => (
                  <option key={student.uniqueId} value={student.uniqueId}>
                    {student.firstName} {student.lastName} ({student.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Test Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Test</label>
              <select
                value={createAttemptForm.testId}
                onChange={(e) => handleCreateAttemptTestChange(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Select Test --</option>
                {tests.map((test) => (
                  <option key={test.testId} value={test.testId}>
                    {test.title} (Course: {typeof test.course === 'object' ? test.course.courseName : test.course})
                  </option>
                ))}
              </select>
            </div>

            {/* Attempt Details (Attempt #, Score, Max Score) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Attempt #</span>
                <Input
                  type="number"
                  min={1}
                  required
                  value={createAttemptForm.attemptNumber}
                  onChange={(e) => setCreateAttemptForm({ ...createAttemptForm, attemptNumber: Number(e.target.value) })}
                  className="bg-background text-foreground border-border h-9"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Score Earned</span>
                <Input
                  type="number"
                  min={0}
                  required
                  value={createAttemptForm.score}
                  onChange={(e) => setCreateAttemptForm({ ...createAttemptForm, score: Number(e.target.value) })}
                  className="bg-background text-foreground border-border h-9"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Max Points</span>
                <Input
                  type="number"
                  min={1}
                  required
                  value={createAttemptForm.totalPoints}
                  onChange={(e) => setCreateAttemptForm({ ...createAttemptForm, totalPoints: Number(e.target.value) })}
                  className="bg-background text-foreground border-border h-9"
                />
              </div>
            </div>

            {/* Attempt Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attempt Status</label>
              <select
                value={createAttemptForm.status}
                onChange={(e) => setCreateAttemptForm({ ...createAttemptForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="COMPLETED">COMPLETED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateAttemptModal(false)} className="text-foreground border-border">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Submit Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attempts CRUD: Edit Attempt Modal */}
      <Dialog open={showEditAttemptModal} onOpenChange={setShowEditAttemptModal}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-2xl text-foreground focus:outline-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Edit Student Attempt Record</DialogTitle>
            <DialogDescription className="text-muted-foreground">Modify statistics, scores, and attempt status values.</DialogDescription>
          </DialogHeader>
          {selectedAttemptToEdit && (
            <div className="p-2 border border-border rounded-lg text-xs bg-muted text-muted-foreground space-y-0.5 mb-2">
              <div><strong>Student:</strong> {selectedAttemptToEdit.user?.firstName} {selectedAttemptToEdit.user?.lastName}</div>
              <div><strong>Test Title:</strong> {selectedAttemptToEdit.test?.title}</div>
              <div><strong>Attempt ID:</strong> {selectedAttemptToEdit.attemptId}</div>
            </div>
          )}
          <form onSubmit={handleEditAttemptSubmit} className="space-y-4">
            {/* Attempt Details (Attempt #, Score, Max Score) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Attempt #</span>
                <Input
                  type="number"
                  min={1}
                  required
                  value={editAttemptForm.attemptNumber}
                  onChange={(e) => setEditAttemptForm({ ...editAttemptForm, attemptNumber: Number(e.target.value) })}
                  className="bg-background text-foreground border-border h-9"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Score Earned</span>
                <Input
                  type="number"
                  min={0}
                  required
                  value={editAttemptForm.score}
                  onChange={(e) => setEditAttemptForm({ ...editAttemptForm, score: Number(e.target.value) })}
                  className="bg-background text-foreground border-border h-9"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Max Points</span>
                <Input
                  type="number"
                  min={1}
                  required
                  value={editAttemptForm.totalPoints}
                  onChange={(e) => setEditAttemptForm({ ...editAttemptForm, totalPoints: Number(e.target.value) })}
                  className="bg-background text-foreground border-border h-9"
                />
              </div>
            </div>

            {/* Attempt Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Attempt Status</label>
              <select
                value={editAttemptForm.status}
                onChange={(e) => setEditAttemptForm({ ...editAttemptForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="COMPLETED">COMPLETED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditAttemptModal(false)} className="text-foreground border-border">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Update Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestPanel;
