import React from "react";
import { motion } from "framer-motion";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import { USER_API } from "@/lib/env";
import { getVerifiedToken } from "@/lib/cookieService";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import TeacherIcon from "@/Icons/TeacherIcon";
import StudentsIcon from "@/Icons/StudentsIcon";
import WarningIcon from "@/Icons/WarningIcon";


// ── Types ─────────────────────────────────────────────────────────────────────
interface IInstructorRequest {
    requestId: string;
    userId: string;
    userName: string;
    fullName: string;
    email: string;
    profileImageUrl?: string;
    reason?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
}

interface IContactMessage {
    _id: string;
    email: string;
    message: string;
    createdAt: string;
    isRead?: boolean;
}

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
        APPROVED: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
        REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-ubuntu font-medium ${map[status] ?? ""}`}>
      {status}
    </span>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const RequestsManagement: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState<"instructor" | "inbox">("instructor");
    const [requests, setRequests] = React.useState<IInstructorRequest[]>([]);
    const [messages, setMessages] = React.useState<IContactMessage[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedRequest, setSelectedRequest] = React.useState<IInstructorRequest | null>(null);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [actionLoading, setActionLoading] = React.useState(false);
    const [filterStatus, setFilterStatus] = React.useState("ALL");
    const [selectedMessage, setSelectedMessage] = React.useState<IContactMessage | null>(null);

    const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
    const { isOpen: isMessageOpen, onOpen: onMessageOpen, onClose: onMessageClose } = useDisclosure();

    const jwt = getVerifiedToken();

    // ── Fetch data ──────────────────────────────────────────────────────────────
    const fetchRequests = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${USER_API}/admin/instructor-requests`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.data?.success) setRequests(res.data.data);
        } catch {
            ErrorToast("Failed to fetch instructor requests");
        } finally {
            setLoading(false);
        }
    }, [jwt]);

    const fetchMessages = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${USER_API}/admin/contact-messages`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.data?.success) setMessages(res.data.data);
        } catch {
            ErrorToast("Failed to fetch messages");
        } finally {
            setLoading(false);
        }
    }, [jwt]);

    React.useEffect(() => {
        if (activeTab === "instructor") fetchRequests();
        else fetchMessages();
    }, [activeTab, fetchRequests, fetchMessages]);

    // ── Approve ─────────────────────────────────────────────────────────────────
    const handleApprove = async (request: IInstructorRequest) => {
        setActionLoading(true);
        try {
            const res = await axios.patch(
                `${USER_API}/admin/instructor-requests/${request.requestId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchRequests();
            } else {
                ErrorToast(res.data.message);
            }
        } catch {
            ErrorToast("Failed to approve request");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Reject ──────────────────────────────────────────────────────────────────
    const handleReject = async () => {
        if (!selectedRequest) return;
        setActionLoading(true);
        try {
            const res = await axios.patch(
                `${USER_API}/admin/instructor-requests/${selectedRequest.requestId}/reject`,
                { rejectionReason },
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );
            if (res.data?.success) {
                SuccessToast("Request rejected");
                fetchRequests();
                onRejectClose();
                setRejectionReason("");
            } else {
                ErrorToast(res.data.message);
            }
        } catch {
            ErrorToast("Failed to reject request");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Filtered requests ────────────────────────────────────────────────────────
    const filteredRequests = filterStatus === "ALL"
        ? requests
        : requests.filter(r => r.status === filterStatus);

    const pendingCount = requests.filter(r => r.status === "PENDING").length;

    // ── Loading skeleton ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="w-full flex flex-col gap-4 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <motion.div
            className="w-full flex flex-col gap-4 rounded-lg p-2"
            variants={{
                hidden: { opacity: 0.3, scale: 0.8 },
                visible: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.8 },
            }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <TeacherIcon fillColor="rgb(139 92 246)" size={28} />
                <h1 className="text-2xl sm:text-3xl font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    Requests
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab("instructor")}
                    className={`relative px-4 py-2 rounded-lg text-sm font-ubuntu font-medium transition-all duration-200 flex items-center gap-2 ${
                        activeTab === "instructor"
                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                    }`}
                >
                    <TeacherIcon fillColor={activeTab === "instructor" ? "white" : "gray"} size={16} />
                    Instructor Requests
                    {pendingCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                            activeTab === "instructor" ? "bg-white/30 text-white" : "bg-yellow-100 text-yellow-700"
                        }`}>
              {pendingCount}
            </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("inbox")}
                    className={`px-4 py-2 rounded-lg text-sm font-ubuntu font-medium transition-all duration-200 flex items-center gap-2 ${
                        activeTab === "inbox"
                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                    }`}
                >
                    <StudentsIcon fillColor={activeTab === "inbox" ? "white" : "gray"} size={16} />
                    Inbox
                    {messages.length > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                            activeTab === "inbox" ? "bg-white/30 text-white" : "bg-blue-100 text-blue-700"
                        }`}>
              {messages.length}
            </span>
                    )}
                </button>
            </div>

            {/* ── Instructor Requests Tab ── */}
            {activeTab === "instructor" && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: "Pending", value: requests.filter(r => r.status === "PENDING").length, color: "from-yellow-400 to-orange-500" },
                            { label: "Approved", value: requests.filter(r => r.status === "APPROVED").length, color: "from-green-400 to-emerald-500" },
                            { label: "Rejected", value: requests.filter(r => r.status === "REJECTED").length, color: "from-red-400 to-rose-500" },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                <p className={`text-2xl font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}>
                                    {stat.value}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterStatus(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-ubuntu font-medium transition-all duration-200 ${
                                    filterStatus === f
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Request cards */}
                    {filteredRequests.length === 0 ? (
                        <div className="w-full flex flex-col items-center py-16 gap-3">
                            <TeacherIcon fillColor="rgb(139 92 246)" size={48} />
                            <p className="text-gray-500 dark:text-gray-400 font-ubuntu">No requests found.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filteredRequests.map((req, i) => (
                                <motion.div
                                    key={req.requestId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                    className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
                                >
                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                        {/* Avatar + info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Avatar className="border-2 border-purple-500 shrink-0">
                                                <AvatarImage src={req.profileImageUrl} />
                                                <AvatarFallback className="font-bold dark:bg-white dark:text-black bg-black text-white">
                                                    {req.fullName?.[0]?.toUpperCase() ?? "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-ubuntu font-semibold text-gray-800 dark:text-white">
                                                        {req.fullName}
                                                    </p>
                                                    <StatusBadge status={req.status} />
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu">@{req.userName}</p>
                                                <p className="text-sm text-blue-500 font-ubuntu">{req.email}</p>
                                                {req.reason && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-libre italic mt-1 line-clamp-2">
                                                        "{req.reason}"
                                                    </p>
                                                )}
                                                {req.rejectionReason && (
                                                    <p className="text-xs text-red-500 font-ubuntu mt-1">
                                                        Rejected: {req.rejectionReason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(req.createdAt).toLocaleDateString("en-IN", {
                                                        day: "numeric", month: "short", year: "numeric"
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {req.status === "PENDING" && (
                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    isLoading={actionLoading}
                                                    className="bg-green-500 text-white font-ubuntu text-xs"
                                                    onClick={() => handleApprove(req)}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-red-400/70 text-white font-ubuntu text-xs"
                                                    onClick={() => { setSelectedRequest(req); onRejectOpen(); }}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Inbox Tab ── */}
            {activeTab === "inbox" && (
                <>
                    {messages.length === 0 ? (
                        <div className="w-full flex flex-col items-center py-16 gap-3">
                            <StudentsIcon fillColor="rgb(139 92 246)" size={48} />
                            <p className="text-gray-500 dark:text-gray-400 font-ubuntu">No messages yet.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={msg._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}
                                    className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-purple-400 transition-colors"
                                    onClick={() => { setSelectedMessage(msg); onMessageOpen(); }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-ubuntu font-semibold text-blue-500">{msg.email}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-libre italic line-clamp-2 mt-1">
                                                {msg.message}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400 shrink-0">
                                            {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "short", year: "numeric"
                                            })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Reject Modal */}
            <Modal backdrop="opaque" isOpen={isRejectOpen} onClose={() => { onRejectClose(); setRejectionReason(""); }}>
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <WarningIcon fillColor="red" />
                        <span className="font-ubuntu text-xl font-bold text-red-600 dark:text-red-400">
              Reject Request
            </span>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm font-ubuntu text-gray-600 dark:text-gray-400">
                            Rejecting request from <span className="font-bold text-purple-500">{selectedRequest?.fullName}</span>
                        </p>
                        <Input
                            placeholder="Reason for rejection (optional)"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            classNames={{ input: "font-ubuntu" }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={() => { onRejectClose(); setRejectionReason(""); }}>Cancel</Button>
                        <Button color="danger" isLoading={actionLoading} onClick={handleReject}>Confirm Reject</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Message Modal */}
            <Modal backdrop="opaque" isOpen={isMessageOpen} onClose={onMessageClose} size="lg">
                <ModalContent>
                    <ModalHeader className="font-ubuntu text-purple-500">
                        Message from {selectedMessage?.email}
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu mb-2">
                            {selectedMessage && new Date(selectedMessage.createdAt).toLocaleString("en-IN")}
                        </p>
                        <p className="text-gray-800 dark:text-gray-200 font-libre whitespace-pre-wrap">
                            {selectedMessage?.message}
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={onMessageClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </motion.div>
    );
};

export default RequestsManagement;