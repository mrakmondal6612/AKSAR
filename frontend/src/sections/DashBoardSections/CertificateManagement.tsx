import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import CertificateView from "./CertificateView";
import {
  Shield,
  Award,
  Search,
  Download,
  Eye,
  Ban,
  RefreshCw,
  FileText,
  Calendar,
  Plus,
  Trash2
} from "lucide-react";
import { getVerifiedToken } from "@/lib/cookieService";
import { TEST_API } from "@/lib/env";
import { SuccessToast, ErrorToast } from "@/lib/toasts";
import axios from "axios";
import TextFlipSmoothRevealEffect from "@/Effects/TextFlipSmoothRevealEffect";

interface Certificate {
  _id: string;
  marksheetId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
  };
  test?: {
    title: string;
    difficulty: string;
  };
  course: {
    courseName: string;
  };
  percentage: number;
  grade: string;
  passed: boolean;
  completionDate: string;
  certificateStatus: string;
  certificateType: string;
  issuedDate: string;
  pointsEarned: number;
  skillsDemonstrated?: string[];
}

interface CertificateStats {
  total: number;
  generated: number;
  downloaded: number;
  revoked: number;
  issuedThisMonth: number;
}

interface DropdownOption {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userName?: string;
  title?: string;
  difficulty?: string;
  courseName?: string;
}

const CertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCertificate] = useState<Certificate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState({
    userId: "",
    testId: "",
    courseId: "",
    certificateType: "COURSE_COMPLETE",
    score: "",
    grade: "",
    skillsDemonstrated: "",
  });
  const [users, setUsers] = useState<DropdownOption[]>([]);
  const [tests, setTests] = useState<DropdownOption[]>([]);
  const [courses, setCourses] = useState<DropdownOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    loadCertificates();
    loadStats();
  }, [currentPage, statusFilter]);

  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true);
      const jwt = getVerifiedToken();

      const [usersRes, testsRes, coursesRes] = await Promise.all([
        axios.get(`${TEST_API}/admin/certificates/dropdown/users`, {
          headers: { Authorization: `Bearer ${jwt}` },
        }),
        axios.get(`${TEST_API}/admin/certificates/dropdown/tests`, {
          headers: { Authorization: `Bearer ${jwt}` },
        }),
        axios.get(`${TEST_API}/admin/certificates/dropdown/courses`, {
          headers: { Authorization: `Bearer ${jwt}` },
        }),
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (testsRes.data.success) setTests(testsRes.data.data);
      if (coursesRes.data.success) setCourses(coursesRes.data.data);
    } catch (error: any) {
      ErrorToast("Failed to load dropdown data");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      loadDropdownData();
    }
  }, [showCreateModal]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const jwt = getVerifiedToken();
      const response = await axios.get(
        `${TEST_API}/admin/certificates?page=${currentPage}&limit=20&status=${statusFilter}&search=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        console.log("Certificates loaded:", response.data.data);
        setCertificates(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      console.error("Failed to load certificates:", error);
      ErrorToast(error?.response?.data?.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const jwt = getVerifiedToken();
      const response = await axios.get(
        `${TEST_API}/admin/certificates/stats`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleRevoke = async (marksheetId: string) => {
    if (!confirm("Are you sure you want to revoke this certificate?")) return;

    try {
      const jwt = getVerifiedToken();
      const response = await axios.patch(
        `${TEST_API}/admin/certificates/${marksheetId}/revoke`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Certificate revoked successfully");
        loadCertificates();
        loadStats();
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to revoke certificate");
    }
  };

  const handleRestore = async (marksheetId: string) => {
    try {
      const jwt = getVerifiedToken();
      const response = await axios.patch(
        `${TEST_API}/admin/certificates/${marksheetId}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Certificate restored successfully");
        loadCertificates();
        loadStats();
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to restore certificate");
    }
  };

  const handleDelete = async (marksheetId: string) => {
    if (!confirm("Are you sure you want to permanently delete this certificate? This action cannot be undone.")) return;

    try {
      const jwt = getVerifiedToken();
      const response = await axios.delete(
        `${TEST_API}/admin/certificates/${marksheetId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Certificate deleted permanently");
        loadCertificates();
        loadStats();
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to delete certificate");
    }
  };

  const handleView = (marksheetId: string) => {
    setSelectedCertificateId(marksheetId);
    setShowCertificateModal(true);
  };

  const handleDownload = async (marksheetId: string) => {
    try {
      const jwt = getVerifiedToken();
      const response = await axios.post(
        `${TEST_API}/admin/certificates/${marksheetId}/download`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Certificate marked as downloaded");
        loadCertificates();
        loadStats();
        // Show certificate in modal
        setSelectedCertificateId(marksheetId);
        setShowCertificateModal(true);
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to download certificate");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data before submit:", createFormData);
    try {
      const jwt = getVerifiedToken();
      const skillsArray = createFormData.skillsDemonstrated
        ? createFormData.skillsDemonstrated.split(",").map((s) => s.trim())
        : [];

      const certificateTypeToSend = createFormData.certificateType || "COURSE_COMPLETE";

      const response = await axios.post(
        `${TEST_API}/admin/certificates`,
        {
          userId: createFormData.userId,
          testId: createFormData.testId || undefined,
          courseId: createFormData.courseId,
          certificateType: certificateTypeToSend,
          score: Number(createFormData.score) || 0,
          grade: createFormData.grade || "N/A",
          skillsDemonstrated: skillsArray,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast("Certificate created successfully");
        setShowCreateModal(false);
        setCreateFormData({
          userId: "",
          testId: "",
          courseId: "",
          certificateType: "COURSE_COMPLETE",
          score: "",
          grade: "",
          skillsDemonstrated: "",
        });
        loadCertificates();
        loadStats();
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to create certificate");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GENERATED":
        return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">Generated</Badge>;
      case "DOWNLOADED":
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Downloaded</Badge>;
      case "REVOKED":
        return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400">Revoked</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getGradeBadge = (grade: string) => {
    const gradeUpper = grade.toUpperCase();
    switch (gradeUpper) {
      case "A+":
        return <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold text-lg px-3 py-1">A+</Badge>;
      case "A":
        return <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-lg px-3 py-1">A</Badge>;
      case "B":
        return <Badge className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white font-bold text-lg px-3 py-1">B</Badge>;
      case "C":
        return <Badge className="bg-gradient-to-r from-purple-400 to-violet-500 text-white font-bold text-lg px-3 py-1">C</Badge>;
      case "D":
        return <Badge className="bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold text-lg px-3 py-1">D</Badge>;
      case "F":
        return <Badge className="bg-gradient-to-r from-red-400 to-rose-500 text-white font-bold text-lg px-3 py-1">F</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-400 font-bold text-lg px-3 py-1">{grade}</Badge>;
    }
  };

  return (
    <motion.div
      className="dark:bg-white/5 bg-black/5 rounded-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex justify-center items-center text-center gap-2 overflow-hidden">
          <TextFlipSmoothRevealEffect text="CERTIFICATE MANAGEMENT" className="sm:text-5xl text-3xl" />
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Certificate
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Certificates</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.generated}</p>
                </div>
                <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Downloaded</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.downloaded}</p>
                </div>
                <Download className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 dark:from-red-500/20 dark:to-red-600/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Revoked</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.revoked}</p>
                </div>
                <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user name, email, or certificate ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="GENERATED">Generated</option>
              <option value="DOWNLOADED">Downloaded</option>
              <option value="REVOKED">Revoked</option>
            </select>
            <Button onClick={() => { loadCertificates(); loadStats(); }} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Certificates
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading certificates...</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No certificates found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Create a certificate to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <motion.div
                  key={cert._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group flex flex-col p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {cert.user?.firstName?.charAt(0) || "?"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-lg truncate">
                          {cert.user?.firstName || "Unknown"} {cert.user?.lastName || "User"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{cert.user?.email || "No email"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                      {cert.test?.title && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                          <FileText className="h-3 w-3" />
                          {cert.test.title}
                        </span>
                      )}
                      {cert.course?.courseName && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                          <Award className="h-3 w-3" />
                          {cert.course.courseName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                        <Calendar className="h-3 w-3" />
                        {formatDate(cert.completionDate)}
                      </span>
                      {getStatusBadge(cert.certificateStatus)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {cert.percentage.toFixed(0)}%
                        </span>
                        {getGradeBadge(cert.grade)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(cert.marksheetId)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-300 dark:border-blue-700 flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(cert.marksheetId)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-300 dark:border-purple-700 flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {cert.certificateStatus === "REVOKED" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(cert.marksheetId)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-300 dark:border-green-700 flex-1"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(cert.marksheetId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700 flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevoke(cert.marksheetId)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-300 dark:border-orange-700 flex-1"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Certificate Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Certificate ID</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.marksheetId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                  {getStatusBadge(selectedCertificate.certificateStatus)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Student Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedCertificate.user.firstName} {selectedCertificate.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.user.email}</p>
                </div>
                {selectedCertificate.test && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Test</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.test.title}</p>
                  </div>
                )}
                {selectedCertificate.course && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Course</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.course.courseName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Score</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.percentage.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Grade</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedCertificate.completionDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Points Earned</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.pointsEarned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Certificate Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Certificate</DialogTitle>
            <DialogDescription>Create a new certificate for a user who has completed a test or course.</DialogDescription>
          </DialogHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {loadingDropdowns ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                </div>
              ) : (
                <>
                  <div>
                    <Label>Certificate Type *</Label>
                    <select
                      value={createFormData.certificateType}
                      onChange={(e) => setCreateFormData({ ...createFormData, certificateType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm mt-1"
                    >
                      <option value="COURSE_COMPLETE">Course Completion</option>
                      <option value="TEST_PASS">Test Pass</option>
                      <option value="ACHIEVEMENT">Achievement</option>
                    </select>
                  </div>

                  <div>
                    <Label>User *</Label>
                    <select
                      value={createFormData.userId}
                      onChange={(e) => setCreateFormData({ ...createFormData, userId: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm mt-1"
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Course *</Label>
                    <select
                      value={createFormData.courseId}
                      onChange={(e) => setCreateFormData({ ...createFormData, courseId: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm mt-1"
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.courseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Test (Optional)</Label>
                    <select
                      value={createFormData.testId}
                      onChange={(e) => setCreateFormData({ ...createFormData, testId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm mt-1"
                    >
                      <option value="">Select Test (Optional)</option>
                      {tests.map((test) => (
                        <option key={test._id} value={test._id}>
                          {test.title} ({test.difficulty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Score *</Label>
                    <Input
                      type="number"
                      value={createFormData.score}
                      onChange={(e) => setCreateFormData({ ...createFormData, score: e.target.value })}
                      required
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <Label>Grade *</Label>
                    <Input
                      value={createFormData.grade}
                      onChange={(e) => setCreateFormData({ ...createFormData, grade: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Skills Demonstrated (comma-separated)</Label>
                    <Input
                      value={createFormData.skillsDemonstrated}
                      onChange={(e) => setCreateFormData({ ...createFormData, skillsDemonstrated: e.target.value })}
                      placeholder="e.g., JavaScript, React, Node.js"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Certificate
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </DialogContent>
      </Dialog>

      {/* Certificate View Modal */}
      {showCertificateModal && selectedCertificateId && (
        <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Certificate View</DialogTitle>
              <DialogDescription>View and download the certificate details.</DialogDescription>
            </DialogHeader>
            <CardContent>
              <CertificateView marksheetId={selectedCertificateId} />
            </CardContent>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default CertificateManagement;
