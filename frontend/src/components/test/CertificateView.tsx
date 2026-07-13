import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Linkedin,
  Twitter,
  Link2,
  ArrowLeft
} from "lucide-react";
import { getMarksheetById } from "@/lib/testService";
import LoadingScreen from "@/components/LoadingScreen";
import { SuccessToast, ErrorToast } from "@/lib/toasts";
import CertificateTemplate from "@/components/CertificateTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateData {
  marksheetId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
  };
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
  issuedDate?: string;
  skillsDemonstrated?: string[];
}

const CertificateView: React.FC = () => {
  const { marksheetId } = useParams<{ marksheetId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (marksheetId) {
      loadCertificate();
    }
  }, [marksheetId]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      const data = await getMarksheetById(marksheetId!);
      setCertificate(data);
    } catch (error: any) {
      console.error("Failed to load certificate:", error);
      ErrorToast("Failed to load certificate details");
    } finally {
      setLoading(false);
    }
  };

  const handleExportAsPDF = async () => {
    if (!certificateRef.current || !certificate) return;

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
      pdf.save(`${certificate.user.firstName}_${certificate.user.lastName}_certificate.pdf`);
      SuccessToast("Certificate exported as PDF");
    } catch (error) {
      ErrorToast("Failed to export certificate as PDF");
    }
  };

  const handleExportAsImage = async () => {
    if (!certificateRef.current || !certificate) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${certificate.user.firstName}_${certificate.user.lastName}_certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      SuccessToast("Certificate exported as image");
    } catch (error) {
      ErrorToast("Failed to export certificate as image");
    }
  };

  const handleShareLinkedIn = () => {
    if (!certificate) return;
    const certificateUrl = `${window.location.origin}/certificateView/${certificate.marksheetId}`;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const handleShareTwitter = () => {
    if (!certificate) return;
    const courseName = certificate.course?.courseName ?? "Course";
    const text = `I just completed ${courseName} on AKSAR! 🎓`;
    const certificateUrl = `${window.location.origin}/certificateView/${certificate.marksheetId}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(certificateUrl)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const handleCopyLink = () => {
    if (!certificate) return;
    const certificateUrl = `${window.location.origin}/certificateView/${certificate.marksheetId}`;
    navigator.clipboard.writeText(certificateUrl);
    SuccessToast("Certificate link copied to clipboard");
  };

  if (loading) return <LoadingScreen />;

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">Certificate not found</p>
            <Button onClick={() => navigate("/user/marksheet")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/40 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/user/marksheet")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marksheets
          </Button>
        </div>

        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-xl">
          <CardContent className="p-4 md:p-8 space-y-6">
            <div className="bg-white p-2 md:p-4 rounded-xl overflow-x-auto shadow-inner border border-slate-100 dark:border-slate-800">
              <div className="min-w-[800px] md:min-w-full">
                <div ref={certificateRef}>
                  <CertificateTemplate certificate={certificate as any} />
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleExportAsPDF}
                className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 hover:border-blue-400 dark:border-slate-700"
              >
                <Download className="h-4 w-4 mr-2 text-blue-500" />
                Export as PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAsImage}
                className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 hover:border-green-400 dark:border-slate-700"
              >
                <Download className="h-4 w-4 mr-2 text-green-500" />
                Export as Image
              </Button>
              <Button
                variant="outline"
                onClick={handleShareLinkedIn}
                className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 hover:border-blue-600 dark:border-slate-700"
              >
                <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                Share on LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={handleShareTwitter}
                className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 hover:border-sky-400 dark:border-slate-700"
              >
                <Twitter className="h-4 w-4 mr-2 text-sky-400" />
                Share on Twitter
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 hover:border-purple-400 dark:border-slate-700"
              >
                <Link2 className="h-4 w-4 mr-2 text-purple-500" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CertificateView;
