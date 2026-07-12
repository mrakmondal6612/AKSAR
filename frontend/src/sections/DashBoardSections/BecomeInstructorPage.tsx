import React from "react";
import { motion } from "framer-motion";
import { Button } from "@nextui-org/react";
import { getVerifiedToken } from "@/lib/cookieService";
import { USER_API } from "@/lib/env";
import { ErrorToast } from "@/lib/toasts";
import axios from "axios";
import BecomeInstructorModal from "@/components/modals/BecomeInstructorModal";


interface IRequestStatus {
    requestId: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    rejectionReason?: string;
}

const BecomeInstructorPage = () => {
    const [loading, setLoading] = React.useState(true);
    const [requestStatus, setRequestStatus] = React.useState<IRequestStatus | null>(null);
    const [showModal, setShowModal] = React.useState(false);

    const fetchMyRequest = React.useCallback(async () => {
        const jwt = getVerifiedToken();
        try {
            const res = await axios.get(`${USER_API}/instructor-request/my`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.data?.success) {
                setRequestStatus(res.data.data);
            }
        } catch {
            ErrorToast("Failed to fetch request status");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchMyRequest();
    }, [fetchMyRequest]);

    // Check if 7 days have passed since rejection
    const canReRequestAfterRejection = React.useMemo(() => {
        if (!requestStatus || requestStatus.status !== "REJECTED") return false;
        const rejectedAt = new Date(requestStatus.createdAt).getTime();
        const daysPassed = (Date.now() - rejectedAt) / (1000 * 60 * 60 * 24);
        return daysPassed >= 7;
    }, [requestStatus]);

    const daysUntilReRequest = React.useMemo(() => {
        if (!requestStatus || requestStatus.status !== "REJECTED") return 0;
        const rejectedAt = new Date(requestStatus.createdAt).getTime();
        const daysPassed = (Date.now() - rejectedAt) / (1000 * 60 * 60 * 24);
        return Math.ceil(7 - daysPassed);
    }, [requestStatus]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    // ── PENDING ────────────────────────────────────────────────────────────────
    if (requestStatus?.status === "PENDING") {
        return (
            <motion.div
                className="w-full h-full flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-yellow-200 dark:border-yellow-800 flex flex-col items-center gap-4 text-center">
                    <div className="text-5xl">⏳</div>
                    <h2 className="text-xl font-bold font-ubuntu text-yellow-600 dark:text-yellow-400">
                        Request Under Review
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-ubuntu">
                        Your instructor request has been submitted and is pending admin approval.
                        You'll be notified once it's reviewed.
                    </p>
                    <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 font-ubuntu">
                            Submitted on {new Date(requestStatus.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "long", year: "numeric"
                        })}
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── REJECTED ───────────────────────────────────────────────────────────────
    if (requestStatus?.status === "REJECTED" && !canReRequestAfterRejection) {
        return (
            <motion.div
                className="w-full h-full flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-red-200 dark:border-red-800 flex flex-col items-center gap-4 text-center">
                    <div className="text-5xl">❌</div>
                    <h2 className="text-xl font-bold font-ubuntu text-red-600 dark:text-red-400">
                        Request Rejected
                    </h2>
                    {requestStatus.rejectionReason && (
                        <div className="w-full bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-700 dark:text-red-400 font-libre italic">
                                "{requestStatus.rejectionReason}"
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-ubuntu">
                        You can re-apply after <span className="font-bold text-purple-500">{daysUntilReRequest} day{daysUntilReRequest !== 1 ? "s" : ""}</span>.
                    </p>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(((7 - daysUntilReRequest) / 7) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 font-ubuntu">
                        {7 - daysUntilReRequest} of 7 days passed
                    </p>
                </div>
            </motion.div>
        );
    }

    // ── NO REQUEST or CAN RE-REQUEST ───────────────────────────────────────────
    return (
        <div className="w-full h-full flex items-center justify-center">
            {showModal ? (
                <BecomeInstructorModal />
            ) : (
                <motion.div
                    className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-purple-200 dark:border-purple-800 flex flex-col items-center gap-4 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {canReRequestAfterRejection && (
                        <div className="w-full bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800 mb-2">
                            <p className="text-sm text-green-700 dark:text-green-400 font-ubuntu">
                                ✅ You can now re-apply for instructor role!
                            </p>
                        </div>
                    )}
                    <div className="text-5xl">🎓</div>
                    <h2 className="text-xl font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        Become an Instructor
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-ubuntu">
                        Share your knowledge with thousands of students. Create courses, upload videos, and track progress.
                    </p>
                    <Button
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-ubuntu w-full"
                        onClick={() => setShowModal(true)}
                    >
                        Apply Now
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

export default BecomeInstructorPage;