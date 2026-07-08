import React from "react";
import { Award, Calendar, Shield, CheckCircle, Share2, QrCode } from "lucide-react";

interface CertificateTemplateProps {
  certificate: {
    marksheetId: string;
    user: {
      firstName: string;
      lastName: string;
    };
    course: {
      courseName: string;
    };
    test?: {
      title: string;
    };
    grade: string;
    percentage: number;
    completionDate: string;
    issuedDate: string;
    skillsDemonstrated?: string[];
    certificateType: string;
  };
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ certificate }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCertificateTitle = () => {
    switch (certificate.certificateType) {
      case "COURSE_COMPLETE":
        return "Certificate of Completion";
      case "TEST_RESULT":
        return "Certificate of Achievement";
      case "OTHERS":
        return "Certificate of Excellence";
      default:
        return "Certificate";
    }
  };

  const getCertificateColor = () => {
    switch (certificate.certificateType) {
      case "COURSE_COMPLETE":
        return "from-emerald-500 via-teal-600 to-cyan-700";
      case "TEST_RESULT":
        return "from-amber-500 via-orange-600 to-red-700";
      case "OTHERS":
        return "from-violet-500 via-purple-600 to-indigo-700";
      default:
        return "from-emerald-500 via-teal-600 to-cyan-700";
    }
  };

  const getCertificateShape = () => {
    switch (certificate.certificateType) {
      case "COURSE_COMPLETE":
        return "rounded-t-3xl rounded-b-2xl";
      case "TEST_RESULT":
        return "rounded-t-2xl rounded-b-3xl";
      case "OTHERS":
        return "rounded-3xl";
      default:
        return "rounded-t-3xl rounded-b-2xl";
    }
  };

  const getVerificationUrl = () => {
    return `${window.location.origin}/verify-certificate?id=${certificate.marksheetId}`;
  };

  return (
    <div className={`w-full max-w-3xl md:max-w-4xl mx-auto bg-white shadow-2xl overflow-hidden ${getCertificateShape()}`}>
      {/* Decorative Border */}
      <div className={`bg-gradient-to-r ${getCertificateColor()} h-2 md:h-6`}></div>
      
      {/* Header */}
      <div className={`bg-gradient-to-br ${getCertificateColor()} p-4 md:p-6 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative flex items-center justify-center mb-2 md:mb-3">
          <img
            src="/images/dark-mode-logo.png"
            alt="AKSAR Logo"
            className="h-12 w-auto md:h-16 object-contain drop-shadow-lg"
          />
        </div>
        <div className="relative text-center">
          <p className="text-[10px] md:text-xs text-white/90 tracking-widest uppercase font-medium">Professional Learning Platform</p>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="text-center py-2 md:py-4 px-3 md:px-6 bg-gradient-to-b from-white to-gray-50">
        <div className={`inline-block px-4 md:px-8 py-1.5 md:py-3 bg-gradient-to-r ${getCertificateColor()} rounded-2xl shadow-lg mb-2 md:mb-3 transform hover:scale-105 transition-transform`}>
          <h2 className="text-sm md:text-2xl font-bold text-white tracking-wide">{getCertificateTitle()}</h2>
        </div>
      </div>

      {/* Student Name */}
      <div className="text-center py-4 md:py-6 px-3 md:px-6 bg-gradient-to-b from-white to-gray-50 relative">
        <div className="absolute inset-0 opacity-5">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r ${getCertificateColor()} rounded-full blur-3xl`}></div>
        </div>
        <p className="text-gray-600 text-xs md:text-base mb-2 md:mb-3 font-medium">This certificate is proudly presented to</p>
        <h3 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
          {certificate.user.firstName} {certificate.user.lastName}
        </h3>
        <div className={`w-12 md:w-24 h-1 bg-gradient-to-r ${getCertificateColor()} mx-auto rounded-full`}></div>
      </div>

      {/* Course/Test Information */}
      <div className="text-center py-4 md:py-6 px-3 md:px-6 bg-white">
        <p className="text-gray-600 text-xs md:text-base mb-2 md:mb-3 font-medium">For successfully completing</p>
        <div className={`inline-block px-4 md:px-8 py-2 md:py-4 bg-gradient-to-r ${getCertificateColor()} bg-opacity-10 rounded-2xl`}>
          <h4 className="text-base md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-1">
            {certificate.test ? certificate.test.title : certificate.course.courseName}
          </h4>
          {certificate.test && (
            <p className="text-gray-600 text-xs md:text-sm font-medium">Course: {certificate.course.courseName}</p>
          )}
        </div>
      </div>

      {/* Performance Details */}
      <div className="grid grid-cols-3 gap-2 md:gap-6 py-4 md:py-6 px-3 md:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center p-3 md:p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-opacity-50 transition-all">
          <div className={`w-10 h-10 md:w-14 md:h-14 bg-gradient-to-r ${getCertificateColor()} rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-lg transform rotate-3`}>
            <Calendar className="h-5 w-5 md:h-7 md:w-7 text-white" />
          </div>
          <p className="text-[10px] md:text-xs text-gray-600 mb-1 font-medium">Completed</p>
          <p className="font-bold text-gray-800 text-xs md:text-base">{formatDate(certificate.completionDate)}</p>
        </div>
        <div className="text-center p-3 md:p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-opacity-50 transition-all">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-lg transform -rotate-3">
            <Shield className="h-5 w-5 md:h-7 md:w-7 text-white" />
          </div>
          <p className="text-[10px] md:text-xs text-gray-600 mb-1 font-medium">Grade</p>
          <p className="font-bold text-gray-800 text-xl md:text-3xl">{certificate.grade}</p>
        </div>
        <div className="text-center p-3 md:p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-opacity-50 transition-all">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-lg transform rotate-3">
            <CheckCircle className="h-5 w-5 md:h-7 md:w-7 text-white" />
          </div>
          <p className="text-[10px] md:text-xs text-gray-600 mb-1 font-medium">Score</p>
          <p className="font-bold text-gray-800 text-xl md:text-3xl">{certificate.percentage.toFixed(0)}%</p>
        </div>
      </div>

      {/* Skills Demonstrated */}
      {certificate.skillsDemonstrated && certificate.skillsDemonstrated.length > 0 && (
        <div className="py-3 md:py-5 px-3 md:px-6 bg-white">
          <p className="text-[10px] md:text-xs text-gray-600 mb-2 md:mb-3 text-center font-semibold uppercase tracking-wide">Skills Demonstrated</p>
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-3">
            {certificate.skillsDemonstrated.map((skill, index) => (
              <span
                key={index}
                className={`px-3 py-1 md:px-5 md:py-2 bg-gradient-to-r ${getCertificateColor()} bg-opacity-10 text-gray-800 rounded-xl text-[10px] md:text-xs font-semibold border-2 border-opacity-20 shadow-md hover:shadow-lg transition-all`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certificate ID and Date */}
      <div className="flex flex-col md:flex-row justify-between items-center py-4 md:py-6 px-3 md:px-6 bg-gradient-to-b from-gray-50 to-white border-t-2 border-gray-100 gap-3 md:gap-0">
        <div className="text-center md:text-left">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Certificate ID</p>
          <p className="font-mono text-xs md:text-sm text-gray-800 bg-white px-3 py-1.5 rounded-xl shadow-inner border border-gray-200">{certificate.marksheetId}</p>
        </div>
        <div className="text-center">
          <div className={`w-12 h-12 md:w-20 md:h-20 bg-gradient-to-r ${getCertificateColor()} rounded-3xl flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-0 transition-transform`}>
            <Award className="h-6 w-6 md:h-10 md:w-10 text-white drop-shadow-lg" />
          </div>
        </div>
        <div className="text-center md:text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Issued Date</p>
          <p className="text-xs md:text-sm text-gray-800 font-bold bg-white px-3 py-1.5 rounded-xl shadow-inner border border-gray-200">{formatDate(certificate.issuedDate)}</p>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="py-3 md:py-5 px-3 md:px-6 bg-white border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="h-4 w-4 text-gray-600" />
              <p className="text-xs font-semibold text-gray-700">Scan to Verify</p>
            </div>
            <p className="text-[10px] text-gray-500 max-w-xs">
              Scan this QR code to verify the authenticity of this certificate on the AKSAR platform.
            </p>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-gray-100">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getVerificationUrl())}&bgcolor=ffffff&color=000000`}
              alt="Certificate Verification QR Code"
              className="w-24 h-24 md:w-32 md:h-32"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`bg-gradient-to-r ${getCertificateColor()} py-2 md:py-4 px-3 md:px-6 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative flex items-center justify-center gap-2 md:gap-3 text-white">
          <Share2 className="h-3 w-3 md:h-4 md:w-4" />
          <p className="text-[10px] md:text-xs text-center font-medium">
            This certificate can be verified at AKSAR platform using the Certificate ID above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
