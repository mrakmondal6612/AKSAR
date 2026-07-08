import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@nextui-org/react";
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
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const navigate = useNavigate();
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
        setCertificates(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error: any) {
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
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by certificate ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              label="Status"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-[180px]"
            >
              <SelectItem key="ALL">All Status</SelectItem>
              <SelectItem key="GENERATED">Generated</SelectItem>
              <SelectItem key="DOWNLOADED">Downloaded</SelectItem>
              <SelectItem key="REVOKED">Revoked</SelectItem>
            </Select>
            <Button onClick={loadCertificates} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No certificates found
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {cert.user.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {cert.user.firstName} {cert.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{cert.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {cert.test && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {cert.test.title}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {cert.course.courseName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(cert.completionDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {cert.percentage.toFixed(0)}%
                        </span>
                        {getStatusBadge(cert.certificateStatus)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Grade: {cert.grade}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(cert.marksheetId)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(cert.marksheetId)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {cert.certificateStatus === "REVOKED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(cert.marksheetId)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 dark:text-red-400"
                          onClick={() => handleRevoke(cert.marksheetId)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 dark:text-red-400"
                        onClick={() => handleDelete(cert.marksheetId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
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
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Course</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.course.courseName}</p>
                </div>
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
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Create Certificate</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                {loadingDropdowns ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Certificate Type *</label>
                      <Select
                        label="Select Certificate Type"
                        placeholder="Choose certificate type"
                        defaultSelectedKeys={["COURSE_COMPLETE"]}
                        selectedKeys={createFormData.certificateType ? [createFormData.certificateType] : ["COURSE_COMPLETE"]}
                        onSelectionChange={(keys) => {
                          const newType = Array.from(keys)[0] as string;
                          setCreateFormData({ 
                            ...createFormData, 
                            certificateType: newType,
                            testId: newType !== "TEST_RESULT" ? "" : createFormData.testId
                          });
                        }}
                        className="w-full"
                      >
                        <SelectItem key="COURSE_COMPLETE" value="COURSE_COMPLETE" textValue="Course Complete">
                          Course Complete
                        </SelectItem>
                        <SelectItem key="TEST_RESULT" value="TEST_RESULT" textValue="Test Result">
                          Test Result
                        </SelectItem>
                        <SelectItem key="OTHERS" value="OTHERS" textValue="Others">
                          Others
                        </SelectItem>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">User *</label>
                      <Select
                        label="Select User"
                        placeholder="Choose a user"
                        selectedKeys={createFormData.userId ? [createFormData.userId] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0];
                          console.log("User selected:", selectedKey);
                          setCreateFormData({ ...createFormData, userId: selectedKey as string });
                        }}
                        className="w-full"
                      >
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id} textValue={`${user.firstName} ${user.lastName}`}>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.firstName} {user.lastName}</span>
                              <span className="text-xs text-gray-500">{user.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    {createFormData.certificateType === "TEST_RESULT" && (
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Test *</label>
                        <Select
                          label="Select Test"
                          placeholder="Choose a test"
                          selectedKeys={createFormData.testId ? [createFormData.testId] : []}
                          onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0];
                            console.log("Test selected:", selectedKey);
                            setCreateFormData({ ...createFormData, testId: selectedKey as string });
                          }}
                          className="w-full"
                        >
                          {tests.map((test) => (
                            <SelectItem key={test._id} value={test._id} textValue={test.title}>
                              <div className="flex flex-col">
                                <span className="font-medium">{test.title}</span>
                                <span className="text-xs text-gray-500">{test.difficulty}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Course *</label>
                      <Select
                        label="Select Course"
                        placeholder="Choose a course"
                        selectedKeys={createFormData.courseId ? [createFormData.courseId] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0];
                          console.log("Course selected:", selectedKey);
                          setCreateFormData({ ...createFormData, courseId: selectedKey as string });
                        }}
                        className="w-full"
                      >
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id} textValue={course.courseName}>
                            {course.courseName}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Score</label>
                  <Input
                    type="number"
                    value={createFormData.score}
                    onChange={(e) => setCreateFormData({ ...createFormData, score: e.target.value })}
                    placeholder="Enter score (0-100)"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Grade</label>
                  <Input
                    value={createFormData.grade}
                    onChange={(e) => setCreateFormData({ ...createFormData, grade: e.target.value })}
                    placeholder="Enter grade (e.g., A, B, C)"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Skills Demonstrated</label>
                  <Input
                    value={createFormData.skillsDemonstrated}
                    onChange={(e) => setCreateFormData({ ...createFormData, skillsDemonstrated: e.target.value })}
                    placeholder="Enter skills separated by commas"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Certificate</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certificate View Modal */}
      {showCertificateModal && selectedCertificateId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Certificate View</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCertificateModal(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CertificateView marksheetId={selectedCertificateId} />
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default CertificateManagement;
