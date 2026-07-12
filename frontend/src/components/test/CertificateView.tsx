import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Award, Download, Calendar, User, CheckCircle, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMarksheetById, downloadCertificate } from "@/lib/testService";
import LoadingScreen from "@/components/LoadingScreen";

interface CertificateData {
  marksheetId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  test: {
    title: string;
    description: string;
    difficulty: string;
  };
  course: {
    courseName: string;
    thumbnail: string;
  };
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
  issuedDate?: string;
  skillsDemonstrated?: string[];
}

const CertificateView: React.FC = () => {
  const { marksheetId } = useParams<{ marksheetId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    loadCertificate();
  }, [marksheetId]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      const data = await getMarksheetById(marksheetId!);
      setCertificate(data);
    } catch (error: any) {
      console.error("Failed to load certificate:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadCertificate(marksheetId!);
    } catch (error) {
      console.error("Failed to download certificate:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <LoadingScreen />;
  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">Certificate not found</p>
            <Button onClick={() => navigate("/marksheet")} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!certificate.passed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md shadow-lg">
          <CardContent className="py-12 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Certificate Not Available
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Certificates are only issued for passed tests
            </p>
            <Button onClick={() => navigate("/marksheet")}>Back to Marksheets</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Actions */}
        <div className="flex justify-end gap-3 mb-6">
          <Button variant="outline" onClick={() => navigate("/marksheet")}>
            Back
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Certificate */}
        <Card className="shadow-2xl overflow-hidden" id="certificate">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <Award className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Certificate of Completion</h1>
            <p className="text-blue-100">This certifies that</p>
          </div>

          <CardContent className="p-8 space-y-8">
            {/* User Name */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {certificate.user.firstName} {certificate.user.lastName}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">{certificate.user.email}</p>
            </div>

            {/* Course Info */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                has successfully completed the test
              </p>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {certificate.test.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">{certificate.course.courseName}</p>
            </div>

            {/* Score & Grade */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {certificate.percentage.toFixed(0)}%
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Score</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {certificate.grade}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Grade</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {certificate.pointsEarned}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Points</div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>Completed: {formatDate(certificate.completionDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <User className="h-4 w-4" />
                <span>Rank: #{certificate.rank || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span>Score: {certificate.score}/{certificate.totalPoints}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span>Percentile: {certificate.percentile?.toFixed(0) || "N/A"}%</span>
              </div>
            </div>

            {/* Skills */}
            {certificate.skillsDemonstrated && certificate.skillsDemonstrated.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Skills Demonstrated
                </h4>
                <div className="flex flex-wrap gap-2">
                  {certificate.skillsDemonstrated.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-slate-100 dark:bg-slate-800">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Verification */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Verified Certificate</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Certificate ID: {certificate.marksheetId}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Issued by AKSAR Learning Platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CertificateView;
