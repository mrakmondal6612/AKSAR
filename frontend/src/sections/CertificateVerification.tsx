import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle, XCircle, Shield, Award, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { verifyCertificatePublic } from "@/lib/testService";

const CertificateVerification: React.FC = () => {
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const urlId = searchParams.get("id");

  const verifyId = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await verifyCertificatePublic(id.trim());
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || "Certificate verification failed");
      setResult(null);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
            <Shield className="h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Certificate Verification
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Enter the certificate ID to verify its authenticity
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Certificate ID"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {result.verified ? (
              <Card className="shadow-lg border-2 border-green-500">
                <CardHeader className="bg-green-50 dark:bg-green-900/20">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-6 w-6" />
                    Valid Certificate
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Student Info */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {result.data.studentName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {result.data.studentName}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Certificate ID: {result.data.certificateId}
                      </div>
                    </div>
                  </div>

                  {/* Course & Test Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Test</span>
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {result.data.testName}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Course</span>
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {result.data.courseName}
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {result.data.percentage?.toFixed(0)}%
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">Score</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {result.data.grade}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Grade</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {result.data.completionDate ? formatDate(result.data.completionDate) : "N/A"}
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">Completed</div>
                    </div>
                  </div>

                  {/* Verification Badge */}
                  <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      This certificate is valid and authentic
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-2 border-red-500">
                <CardHeader className="bg-red-50 dark:bg-red-900/20">
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <XCircle className="h-6 w-6" />
                    Invalid Certificate
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <XCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {result.message || "This certificate could not be verified"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">About Certificate Verification</p>
                  <p>
                    This system allows anyone to verify the authenticity of certificates issued by AKSAR Learning Platform. 
                    Simply enter the certificate ID shown on the certificate to check its validity.
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
