import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle, XCircle, Shield, Award, FileText, Download, Linkedin, Twitter, Calendar, Copy, Check, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { verifyCertificatePublic } from "@/lib/testService";
import CertificateTemplate from "@/components/CertificateTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const getMappedCertificateData = (data: any) => {
  const nameParts = data.studentName?.split(" ") || ["", ""];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return {
    marksheetId: data.certificateId,
    user: { firstName, lastName },
    course: { courseName: data.courseName },
    test: data.testName && data.testName !== "N/A" ? { title: data.testName } : undefined,
    grade: data.grade,
    percentage: data.percentage,
    completionDate: data.completionDate,
    issuedDate: data.completionDate,
    certificateType: "COURSE_COMPLETE"
  };
};

const CertificateVerification: React.FC = () => {
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleExportAsPDF = async () => {
    if (!certificateRef.current || !result?.data) return;

    // Temporarily force 920px width for high quality desktop capture on mobile
    const originalWidth = certificateRef.current.style.width;
    certificateRef.current.style.width = "920px";

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${result.data.studentName.replace(/\s+/g, "_")}_certificate.pdf`);
    } catch (error) {
      console.error("Failed to export certificate as PDF", error);
    } finally {
      certificateRef.current.style.width = originalWidth;
    }
  };

  const handleExportAsImage = async () => {
    if (!certificateRef.current || !result?.data) return;

    // Temporarily force 920px width for high quality desktop capture on mobile
    const originalWidth = certificateRef.current.style.width;
    certificateRef.current.style.width = "920px";

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${result.data.studentName.replace(/\s+/g, "_")}_certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to export certificate as image", error);
    } finally {
      certificateRef.current.style.width = originalWidth;
    }
  };

  const handleShareLinkedIn = () => {
    if (!result?.data) return;
    const certificateUrl = `${window.location.origin}/verify-certificate?id=${result.data.certificateId}`;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const handleShareTwitter = () => {
    if (!result?.data) return;
    const text = `I verified my certificate for ${result.data.courseName} on AKSAR! 🎓`;
    const certificateUrl = `${window.location.origin}/verify-certificate?id=${result.data.certificateId}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(certificateUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const handleCopyLink = () => {
    if (!result?.data) return;
    const certificateUrl = `${window.location.origin}/verify-certificate?id=${result.data.certificateId}`;
    navigator.clipboard.writeText(certificateUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const [searchParams] = useSearchParams();
  const urlId = searchParams.get("id");

  const verifyId = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      // Step 1: Registry Connection simulation
      setLoadingStage(1);
      await new Promise((resolve) => setTimeout(resolve, 700));
      
      // Step 2: Signature decryption simulation
      setLoadingStage(2);
      await new Promise((resolve) => setTimeout(resolve, 700));
      
      // Step 3: Integrity verification simulation
      setLoadingStage(3);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const response = await verifyCertificatePublic(id.trim());
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || "Certificate verification failed");
      setResult(null);
    } finally {
      setLoading(false);
      setLoadingStage(0);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId.trim()) {
      setError("Please enter a certificate ID");
      return;
    }
    await verifyId(certificateId);
  };

  useEffect(() => {
    if (urlId) {
      const cleanId = urlId.trim();
      setCertificateId(cleanId);
      verifyId(cleanId);
    }
  }, [urlId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#080b11] dark:via-[#111625] dark:to-[#080b11] pt-20 md:pt-28 pb-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-950/20 text-white">
            <Shield className="h-10 w-10 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-white dark:via-slate-200 dark:to-indigo-300">
            Credential Verifier
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm sm:text-base">
            Verify the authenticity and integrity of certificates issued by AKSAR Learning Platform.
          </p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto"
        >
          <Card className="shadow-2xl border-white/40 dark:border-slate-800/80 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60">
            <CardContent className="pt-6">
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Enter Certificate ID"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      className="pl-10 h-12 bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-indigo-500 transition-all font-mono"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 transition-all"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30"
                  >
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading Steps */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto"
          >
            <Card className="shadow-2xl border-white/40 dark:border-slate-800/80 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 overflow-hidden">
              <CardContent className="py-8 space-y-6 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-3.5 w-full max-w-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span className={loadingStage >= 1 ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-slate-400 dark:text-slate-600"}>
                      1. Connecting to AKSAR registry...
                    </span>
                    {loadingStage > 1 ? (
                      <CheckCircle className="h-4.5 w-4.5 text-green-500 fill-green-50/50 dark:fill-green-950/10" />
                    ) : loadingStage === 1 ? (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={loadingStage >= 2 ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-slate-400 dark:text-slate-600"}>
                      2. Decrypting cryptographic signature...
                    </span>
                    {loadingStage > 2 ? (
                      <CheckCircle className="h-4.5 w-4.5 text-green-500 fill-green-50/50 dark:fill-green-950/10" />
                    ) : loadingStage === 2 ? (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={loadingStage >= 3 ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-slate-400 dark:text-slate-600"}>
                      3. Validating record integrity...
                    </span>
                    {loadingStage === 3 ? (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Verification Result details */}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            {result.verified ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Verification Info */}
                <div className="lg:col-span-5 space-y-6">
                  <Card className="shadow-2xl border-green-500/30 dark:border-green-500/20 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 overflow-hidden">
                    <CardHeader className="bg-green-50/50 dark:bg-green-950/10 border-b border-green-100/50 dark:border-green-900/20 py-5">
                      <CardTitle className="flex items-center gap-2.5 text-green-700 dark:text-green-400">
                        <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                          <CheckCircle className="h-5.5 w-5.5" />
                        </div>
                        Valid Credentials Verified
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-6 space-y-6">
                      {/* Recipient Profile */}
                      <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/15">
                          {result.data.studentName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                            {result.data.studentName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            ID: {result.data.certificateId}
                          </div>
                        </div>
                      </div>

                      {/* Course / Test Info */}
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
                          <div className="flex items-center gap-2 mb-1.5 text-slate-500 dark:text-slate-400">
                            <Award className="h-4.5 w-4.5 text-indigo-500" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Course Detail</span>
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {result.data.courseName}
                          </div>
                        </div>

                        {result.data.testName && result.data.testName !== "N/A" && (
                          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
                            <div className="flex items-center gap-2 mb-1.5 text-slate-500 dark:text-slate-400">
                              <FileText className="h-4.5 w-4.5 text-purple-500" />
                              <span className="text-xs font-semibold uppercase tracking-wider">Assessment / Test</span>
                            </div>
                            <div className="font-bold text-slate-800 dark:text-slate-100">
                              {result.data.testName}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Grades & Performance details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl text-center relative overflow-hidden group">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Grade</span>
                          <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-all">
                            {result.data.grade}
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl text-center relative overflow-hidden group">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Percentage</span>
                          <span className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-all">
                            {result.data.percentage?.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Meta: Issue Date */}
                      <div className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl text-sm">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="text-slate-400 text-xs">Completion Date</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {result.data.completionDate ? formatDate(result.data.completionDate) : "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Blockchain status indicator */}
                      <div className="flex items-center gap-3 justify-center p-4 bg-green-50/30 dark:bg-green-950/10 border border-green-200/50 dark:border-green-900/20 rounded-2xl text-green-700 dark:text-green-400 text-xs sm:text-sm font-semibold">
                        <Shield className="h-5 w-5" />
                        Secured & Cryptographically Audited
                      </div>

                      {/* Verification Link Copy button */}
                      <Button
                        variant="outline"
                        onClick={handleCopyLink}
                        className="w-full h-11 border-dashed rounded-xl font-medium flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/50"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="h-4.5 w-4.5 text-green-500" />
                            <span>Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4.5 w-4.5 text-slate-500" />
                            <span>Copy Verification Link</span>
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Side: Visual Preview & Export Actions */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className="shadow-2xl border-white/40 dark:border-slate-800/80 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20">
                      <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Official Certificate Frame Preview
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFullscreen(true)}
                        className="h-8 text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-850"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Fullscreen
                      </Button>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-inner group relative w-full">
                        <div className="w-full" ref={certificateRef}>
                          <CertificateTemplate certificate={getMappedCertificateData(result.data)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions & Sharing Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleExportAsPDF}
                      className="h-11 rounded-xl shadow-sm border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-350 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="h-4.5 w-4.5 text-indigo-500" />
                      <span>PDF Export</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleExportAsImage}
                      className="h-11 rounded-xl shadow-sm border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-350 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="h-4.5 w-4.5 text-purple-500" />
                      <span>Image Export</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleShareLinkedIn}
                      className="h-11 rounded-xl shadow-sm bg-blue-50/50 hover:bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50 font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Linkedin className="h-4.5 w-4.5 fill-current" />
                      <span>Share</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleShareTwitter}
                      className="h-11 rounded-xl shadow-sm bg-sky-50/50 hover:bg-sky-50 text-sky-500 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50 font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Twitter className="h-4.5 w-4.5 fill-current" />
                      <span>Tweet</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <Card className="shadow-2xl border-red-500/30 dark:border-red-500/20 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 overflow-hidden">
                  <CardHeader className="bg-red-50/50 dark:bg-red-950/10 border-b border-red-100/50 dark:border-red-900/20 py-5">
                    <CardTitle className="flex items-center gap-2.5 text-red-700 dark:text-red-400">
                      <XCircle className="h-5.5 w-5.5" />
                      Verification Failed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 pb-8 text-center space-y-5">
                    <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 shadow-md">
                      <XCircle className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Invalid Certificate ID</h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto text-sm">
                        {result.message || "We could not find any active credential matching this identifier. Please verify the ID and retry."}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setResult(null);
                        setCertificateId("");
                      }}
                      className="rounded-xl px-6 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 text-white font-semibold"
                    >
                      Try Another ID
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}

        {/* Modal: Fullscreen View */}
        <AnimatePresence>
          {isFullscreen && result?.data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-5xl bg-white dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between py-4 px-6 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Fullscreen Viewer</h3>
                  <Button
                    variant="ghost"
                    onClick={() => setIsFullscreen(false)}
                    className="h-9 px-3 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 font-bold"
                  >
                    Close
                  </Button>
                </div>
                <div className="p-6 overflow-auto max-h-[80vh] flex justify-center w-full">
                  <div className="w-full max-w-4xl">
                    <CertificateTemplate certificate={getMappedCertificateData(result.data)} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQ/Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto"
        >
          <Card className="bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5.5 w-5.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-900/80 dark:text-indigo-200/80">
                  <p className="font-bold text-indigo-950 dark:text-indigo-200 mb-1">Verify with Confidence</p>
                  <p className="leading-relaxed">
                    This cryptographic lookup utility verifies AKSAR credentials against our secure, immutable ledger database. 
                    Verified certificates confirm successful completion of course topics and assessments under designated timelines.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CertificateVerification;
