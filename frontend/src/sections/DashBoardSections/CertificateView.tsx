import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Linkedin,
  Twitter,
  Link2,
  ArrowLeft
} from "lucide-react";
import { SuccessToast, ErrorToast } from "@/lib/toasts";
import { TEST_API } from "@/lib/env";
import { getVerifiedToken } from "@/lib/cookieService";
import axios from "axios";
import CertificateTemplate from "@/components/CertificateTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

interface CertificateViewProps {
  marksheetId?: string;
}

const CertificateView: React.FC<CertificateViewProps> = ({ marksheetId: propMarksheetId }) => {
  const { marksheetId: paramMarksheetId } = useParams<{ marksheetId: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef<HTMLDivElement>(null);

  const marksheetId = propMarksheetId || paramMarksheetId;

  useEffect(() => {
    if (marksheetId) {
      loadCertificate(marksheetId);
    }
  }, [marksheetId]);

  const loadCertificate = async (id: string) => {
    try {
      const jwt = getVerifiedToken();
      const response = await axios.get(
        `${TEST_API}/admin/certificates/${id}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setCertificate(response.data.data);
        setLoading(false);
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Failed to load certificate");
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
    const text = `I just completed ${certificate.course.courseName} on AKSAR! 🎓`;
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

  const isModalView = !!propMarksheetId;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Certificate not found</p>
          {!isModalView && (
            <Button onClick={() => navigate("/admin/certificate")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Certificates
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isModalView) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-2 md:p-4 rounded-lg overflow-x-auto">
          <div className="min-w-full">
            <div ref={certificateRef}>
              <CertificateTemplate certificate={certificate} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportAsPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportAsImage}
          >
            <Download className="h-4 w-4 mr-2" />
            Export as Image
          </Button>
          <Button
            variant="outline"
            onClick={handleShareLinkedIn}
          >
            <Linkedin className="h-4 w-4 mr-2" />
            Share on LinkedIn
          </Button>
          <Button
            variant="outline"
            onClick={handleShareTwitter}
          >
            <Twitter className="h-4 w-4 mr-2" />
            Share on Twitter
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/certificate")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Certificates
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Certificate View</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white p-2 md:p-4 rounded-lg overflow-x-auto">
              <div className="min-w-full">
                <div ref={certificateRef}>
                  <CertificateTemplate certificate={certificate} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportAsPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAsImage}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as Image
              </Button>
              <Button
                variant="outline"
                onClick={handleShareLinkedIn}
              >
                <Linkedin className="h-4 w-4 mr-2" />
                Share on LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={handleShareTwitter}
              >
                <Twitter className="h-4 w-4 mr-2" />
                Share on Twitter
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
              >
                <Link2 className="h-4 w-4 mr-2" />
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
