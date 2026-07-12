import React from "react";
import { motion } from "framer-motion";
import {
    Button,
    Image,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure,
    Switch,
    Chip,
    Textarea,
    Checkbox,
    Select,
    SelectItem,
} from "@nextui-org/react";
import axios from "axios";
import { USER_API } from "@/lib/env";
import { getVerifiedToken } from "@/lib/cookieService";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import StudentsIcon from "@/Icons/StudentsIcon";
import FilterIcon from "@/Icons/FilterIcon";
import WarningIcon from "@/Icons/WarningIcon";
import VerificationIcon from "@/Icons/VerificationIcon";

interface IStudent {
    _id: string;
    uniqueId: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    profileImageUrl?: string;
    emailVerificationStatus: boolean;
    phoneNumberVerificationStatus: boolean;
    bio?: string;
    userDob?: string;
    address?: {
        country: string;
        state: string;
        city: string;
    };
    phoneNumber?: {
        code: string;
        number: string;
    };
    enrolledIn?: string[];
    createdAt: string;
}

interface IStudentStats {
    totalStudents: number;
    verifiedEmails: number;
    verifiedPhones: number;
    recentStudents: IStudent[];
}

const StudentsManagement: React.FC = () => {
    const [students, setStudents] = React.useState<IStudent[]>([]);
    const [stats, setStats] = React.useState<IStudentStats | null>(null);
    const [filtered, setFiltered] = React.useState<IStudent[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [activeFilter, setActiveFilter] = React.useState("All");
    const [selectedStudent, setSelectedStudent] = React.useState<IStudent | null>(null);
    const [deletePassword, setDeletePassword] = React.useState("");
    const [togglingId, setTogglingId] = React.useState<string | null>(null);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
    const { isOpen: isCoursesOpen, onClose: onCoursesClose } = useDisclosure();
    const { isOpen: isBulkDeleteOpen, onOpen: onBulkDeleteOpen, onClose: onBulkDeleteClose } = useDisclosure();
    const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
    const { isOpen: isAnalyticsOpen, onOpen: onAnalyticsOpen, onClose: onAnalyticsClose } = useDisclosure();
    const { isOpen: isNotificationOpen, onOpen: onNotificationOpen, onClose: onNotificationClose } = useDisclosure();
    const { isOpen: isActivityOpen, onClose: onActivityClose } = useDisclosure();
    const { isOpen: isNotesOpen, onClose: onNotesClose } = useDisclosure();
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

    // Advanced filter states
    const [selectedStudents, setSelectedStudents] = React.useState<Set<string>>(new Set());
    const [filterCountry, setFilterCountry] = React.useState("");
    const [filterCity, setFilterCity] = React.useState("");
    const [filterEnrolled, setFilterEnrolled] = React.useState("");
    const [filterDateFrom, setFilterDateFrom] = React.useState("");
    const [filterDateTo, setFilterDateTo] = React.useState("");
    const [sortBy, setSortBy] = React.useState("createdAt");
    const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

    // Notification and notes states
    const [notificationSubject, setNotificationSubject] = React.useState("");
    const [notificationMessage, setNotificationMessage] = React.useState("");
    const [studentNotes, setStudentNotes] = React.useState<Record<string, string>>({});

    // Edit form state
    const [editForm, setEditForm] = React.useState({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        bio: "",
        userDob: "",
        country: "",
        state: "",
        city: "",
        phoneCode: "",
        phoneNumber: "",
    });

    // Add form state
    const [addForm, setAddForm] = React.useState({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        password: "",
        bio: "",
        userDob: "",
        country: "",
        state: "",
        city: "",
        phoneCode: "",
        phoneNumber: "",
    });

    const fetchStudents = React.useCallback(async () => {
        setLoading(true);
        const jwt = getVerifiedToken();
        try {
            const res = await axios.get(`${USER_API}/admin/students?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.data?.success) {
                setStudents(res.data.data);
                setFiltered(res.data.data);
                setTotalPages(res.data.pagination?.pages || 1);
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to fetch students");
        } finally {
            setLoading(false);
        }
    }, [page]);

    const fetchStats = React.useCallback(async () => {
        const jwt = getVerifiedToken();
        try {
            const res = await axios.get(`${USER_API}/admin/students/stats`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.data?.success) {
                setStats(res.data.data);
            }
        } catch (err: any) {
            console.error("Failed to fetch stats", err);
        }
    }, []);

    React.useEffect(() => {
        fetchStudents();
        fetchStats();
    }, [fetchStudents, fetchStats]);

    React.useEffect(() => {
        let result = students;
        if (activeFilter !== "All") {
            if (activeFilter === "VERIFIED") {
                result = result.filter((s) => s.emailVerificationStatus === true);
            } else if (activeFilter === "UNVERIFIED") {
                result = result.filter((s) => s.emailVerificationStatus === false);
            }
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (s) =>
                    s.firstName.toLowerCase().includes(q) ||
                    s.lastName.toLowerCase().includes(q) ||
                    s.userName.toLowerCase().includes(q) ||
                    s.email.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [search, activeFilter, students]);

    const handleToggleEmailVerification = async (student: IStudent) => {
        setTogglingId(student._id);
        const jwt = getVerifiedToken();
        try {
            const res = await axios.patch(
                `${USER_API}/admin/students/${student._id}/email-verification`,
                {},
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );
            if (res.data?.success) {
                SuccessToast(res.data.message);
                setStudents((prev) =>
                    prev.map((s) =>
                        s._id === student._id
                            ? { ...s, emailVerificationStatus: !s.emailVerificationStatus }
                            : s
                    )
                );
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to update status");
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedStudent || !deletePassword) return;
        const jwt = getVerifiedToken();
        try {
            const res = await axios.delete(
                `${USER_API}/admin/students/${selectedStudent._id}`,
                {
                    data: { password: deletePassword },
                    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
                }
            );
            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchStudents();
                fetchStats();
                onClose();
                setDeletePassword("");
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Something went wrong");
        }
    };

    const openDeleteModal = (student: IStudent) => {
        setSelectedStudent(student);
        setDeletePassword("");
        onOpen();
    };

    const openEditModal = (student: IStudent) => {
        setSelectedStudent(student);
        setEditForm({
            firstName: student.firstName,
            lastName: student.lastName || "",
            userName: student.userName,
            email: student.email,
            bio: student.bio || "",
            userDob: student.userDob || "",
            country: student.address?.country || "",
            state: student.address?.state || "",
            city: student.address?.city || "",
            phoneCode: student.phoneNumber?.code || "",
            phoneNumber: student.phoneNumber?.number || "",
        });
        onEditOpen();
    };

    const handleUpdateStudent = async () => {
        if (!selectedStudent) return;
        const jwt = getVerifiedToken();
        try {
            const updateData: any = {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                userName: editForm.userName,
                email: editForm.email,
                bio: editForm.bio,
                userDob: editForm.userDob,
            };

            if (editForm.country || editForm.state || editForm.city) {
                updateData.address = {
                    country: editForm.country,
                    state: editForm.state,
                    city: editForm.city,
                };
            }

            if (editForm.phoneCode || editForm.phoneNumber) {
                updateData.phoneNumber = {
                    code: editForm.phoneCode,
                    number: editForm.phoneNumber,
                };
            }

            const res = await axios.put(
                `${USER_API}/admin/students/${selectedStudent._id}`,
                updateData,
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );

            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchStudents();
                onEditClose();
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to update student");
        }
    };

    const openViewModal = (student: IStudent) => {
        setSelectedStudent(student);
        onViewOpen();
    };



    // Bulk operations
    const toggleSelectStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedStudents.size === filtered.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filtered.map(s => s._id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedStudents.size === 0) return;
        const jwt = getVerifiedToken();
        try {
            const deletePromises = Array.from(selectedStudents).map(studentId =>
                axios.delete(`${USER_API}/admin/students/${studentId}`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                    data: { password: deletePassword }
                })
            );
            await Promise.all(deletePromises);
            SuccessToast(`${selectedStudents.size} students deleted successfully`);
            setSelectedStudents(new Set());
            setDeletePassword("");
            onBulkDeleteClose();
            fetchStudents();
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to delete students");
        }
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ["ID", "Name", "Username", "Email", "Country", "City", "Email Verified", "Phone Verified", "Enrolled Courses", "Joined Date"];
        const csvContent = [
            headers.join(","),
            ...filtered.map(student => [
                student.uniqueId,
                `${student.firstName} ${student.lastName}`,
                student.userName,
                student.email,
                student.address?.country || "",
                student.address?.city || "",
                student.emailVerificationStatus ? "Yes" : "No",
                student.phoneNumberVerificationStatus ? "Yes" : "No",
                student.enrolledIn?.length || 0,
                new Date(student.createdAt).toLocaleDateString()
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `students_export_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        SuccessToast("Export successful!");
    };

    // Apply advanced filters
    const applyFilters = () => {
        let filtered = [...students];

        if (filterCountry) {
            filtered = filtered.filter(s => s.address?.country?.toLowerCase().includes(filterCountry.toLowerCase()));
        }
        if (filterCity) {
            filtered = filtered.filter(s => s.address?.city?.toLowerCase().includes(filterCity.toLowerCase()));
        }
        if (filterEnrolled === "yes") {
            filtered = filtered.filter(s => s.enrolledIn && s.enrolledIn.length > 0);
        } else if (filterEnrolled === "no") {
            filtered = filtered.filter(s => !s.enrolledIn || s.enrolledIn.length === 0);
        }
        if (filterDateFrom) {
            filtered = filtered.filter(s => new Date(s.createdAt) >= new Date(filterDateFrom));
        }
        if (filterDateTo) {
            filtered = filtered.filter(s => new Date(s.createdAt) <= new Date(filterDateTo));
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aValue = a[sortBy as keyof IStudent] as string;
            const bValue = b[sortBy as keyof IStudent] as string;
            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFiltered(filtered);
        onFilterClose();
    };

    const clearFilters = () => {
        setFilterCountry("");
        setFilterCity("");
        setFilterEnrolled("");
        setFilterDateFrom("");
        setFilterDateTo("");
        setSortBy("createdAt");
        setSortOrder("desc");
        setFiltered(students);
        onFilterClose();
    };

    // Analytics handler
    const openAnalyticsModal = (student: IStudent) => {
        setSelectedStudent(student);
        onAnalyticsOpen();
    };

    // Notification handler
    const handleSendNotification = async () => {
        if (selectedStudents.size === 0) return;
        const jwt = getVerifiedToken();
        try {
            const studentIds = Array.from(selectedStudents);
            const response = await axios.post(
                `${USER_API}/admin/send-notification`,
                {
                    studentIds,
                    subject: notificationSubject,
                    message: notificationMessage,
                },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            if (response.data?.success) {
                SuccessToast("Notification sent successfully!");
                setNotificationSubject("");
                setNotificationMessage("");
                onNotificationClose();
            } else {
                ErrorToast(response.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to send notification");
        }
    };

    // Activity logs handler (mock data for now)


    // Notes handler


    const saveNotes = () => {
        if (selectedStudent) {
            setStudentNotes({ ...studentNotes, [selectedStudent._id]: studentNotes[selectedStudent._id] || "" });
            SuccessToast("Notes saved successfully!");
            onNotesClose();
        }
    };

    const handleAddStudent = async () => {
        const jwt = getVerifiedToken();
        try {
            const createData: any = {
                firstName: addForm.firstName,
                lastName: addForm.lastName,
                userName: addForm.userName,
                email: addForm.email,
                password: addForm.password,
                bio: addForm.bio,
                userDob: addForm.userDob,
            };

            if (addForm.country || addForm.state || addForm.city) {
                createData.address = {
                    country: addForm.country,
                    state: addForm.state,
                    city: addForm.city,
                };
            }

            if (addForm.phoneCode || addForm.phoneNumber) {
                createData.phoneNumber = {
                    code: addForm.phoneCode,
                    number: addForm.phoneNumber,
                };
            }

            const res = await axios.post(
                `${USER_API}/admin/students`,
                createData,
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );

            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchStudents();
                fetchStats();
                onAddClose();
                setAddForm({
                    firstName: "",
                    lastName: "",
                    userName: "",
                    email: "",
                    password: "",
                    bio: "",
                    userDob: "",
                    country: "",
                    state: "",
                    city: "",
                    phoneCode: "",
                    phoneNumber: "",
                });
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to add student");
        }
    };

    const filters = ["All", "VERIFIED", "UNVERIFIED"];

    if (loading) {
        return (
            <div className="w-full flex flex-col gap-4 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full h-32 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <StudentsIcon fillColor="rgb(139 92 246)" size={24} />
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        Students Management
                    </h1>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {stats && [
                    { label: "Total Students", value: stats.totalStudents, color: "from-indigo-500 to-purple-500" },
                    { label: "Verified Emails", value: stats.verifiedEmails, color: "from-green-400 to-emerald-500" },
                    { label: "Verified Phones", value: stats.verifiedPhones, color: "from-blue-400 to-cyan-500" },
                    { label: "Recent", value: stats.recentStudents?.length || 0, color: "from-orange-400 to-amber-500" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <p className={`text-xl sm:text-2xl font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}>
                            {stat.value}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-ubuntu mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Search + Filter + Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    placeholder="Search by name, username, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                    size="sm"
                    classNames={{
                        input: "font-ubuntu text-xs sm:text-sm",
                        inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                    }}
                />
                <div className="flex gap-2 flex-wrap">
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-ubuntu text-xs sm:text-sm"
                        onClick={onAddOpen}
                    >
                        + Add Student
                    </Button>
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-ubuntu font-medium transition-all duration-200 flex items-center gap-1 ${activeFilter === f
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400"
                                }`}
                        >
                            {f === "All" && <FilterIcon fillColor={activeFilter === f ? "white" : "gray"} size={12} />}
                            {f === "VERIFIED" && <VerificationIcon fillColor={activeFilter === f ? "white" : "green"} size={12} />}
                            {f === "UNVERIFIED" && <WarningIcon fillColor={activeFilter === f ? "white" : "red"} size={12} />}
                            {f === "All" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                    <Button
                        size="sm"
                        variant="bordered"
                        onClick={onFilterOpen}
                        className="font-ubuntu text-xs sm:text-sm"
                    >
                        Advanced Filters
                    </Button>
                    <Button
                        size="sm"
                        variant="bordered"
                        onClick={exportToCSV}
                        className="font-ubuntu text-xs sm:text-sm"
                    >
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedStudents.size > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-ubuntu text-purple-700 dark:text-purple-300">
                        {selectedStudents.size} student{selectedStudents.size > 1 ? "s" : ""} selected
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onClick={onBulkDeleteOpen}
                            className="font-ubuntu text-xs sm:text-sm"
                        >
                            Delete Selected
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            onClick={() => setSelectedStudents(new Set())}
                            className="font-ubuntu text-xs sm:text-sm"
                        >
                            Clear Selection
                        </Button>
                        <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onClick={onNotificationOpen}
                            className="font-ubuntu text-xs sm:text-sm"
                            isDisabled={selectedStudents.size === 0}
                        >
                            Send Notification
                        </Button>
                    </div>
                </div>
            )}

            {/* Results count + Select All */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-ubuntu">
                    Showing <span className="font-bold text-purple-500">{filtered.length}</span> of {students.length} students
                </p>
                {filtered.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Checkbox
                            isSelected={selectedStudents.size === filtered.length && filtered.length > 0}
                            onValueChange={toggleSelectAll}
                            size="sm"
                        >
                            <span className="text-xs sm:text-sm font-ubuntu text-gray-600 dark:text-gray-400">Select All</span>
                        </Checkbox>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="w-full flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
                    <StudentsIcon fillColor="rgb(139 92 246)" size={36} />
                    <p className="text-sm sm:text-lg font-ubuntu text-gray-500 dark:text-gray-400">
                        No students match your search.
                    </p>
                </div>
            )}

            {/* Student cards - Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map((student, i) => (
                    <motion.div
                        key={student._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className={`w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg overflow-hidden ${student.emailVerificationStatus
                                ? "border-gray-100 dark:border-gray-700 hover:border-purple-300"
                                : "border-red-200 dark:border-red-500/30 hover:border-red-400"
                            }`}
                    >
                        <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4">
                            {/* Header with Checkbox and Profile */}
                            <div className="flex items-start gap-2 sm:gap-3">
                                <Checkbox
                                    isSelected={selectedStudents.has(student._id)}
                                    onValueChange={() => toggleSelectStudent(student._id)}
                                    size="sm"
                                    className="mt-1"
                                />
                                <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 relative">
                                    <Image
                                        isBlurred
                                        src={student.profileImageUrl || "https://via.placeholder.com/80"}
                                        alt={student.firstName}
                                        className="object-cover aspect-square rounded-xl w-full h-full"
                                    />
                                    <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-ubuntu font-bold z-10 ${student.emailVerificationStatus
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                    }`}>
                                        {student.emailVerificationStatus ? "✓" : "!"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 line-clamp-1">
                                        {student.firstName} {student.lastName}
                                    </h2>
                                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-ubuntu line-clamp-1">
                                        @{student.userName}
                                    </p>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {student.emailVerificationStatus && (
                                            <Chip size="sm" color="success" variant="flat" className="font-ubuntu text-[10px] h-5">
                                                Email
                                            </Chip>
                                        )}
                                        {student.phoneNumberVerificationStatus && (
                                            <Chip size="sm" color="primary" variant="flat" className="font-ubuntu text-[10px] h-5">
                                                Phone
                                            </Chip>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Email and Location */}
                            <div className="space-y-1">
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-ubuntu line-clamp-1">
                                    {student.email}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-ubuntu">
                                    {student.address && (
                                        <span className="line-clamp-1">
                                            {student.address.city}, {student.address.country}
                                        </span>
                                    )}
                                    {student.enrolledIn && student.enrolledIn.length > 0 && (
                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                            {student.enrolledIn.length} courses
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-1.5 sm:gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex gap-1.5 sm:gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        className="font-ubuntu text-[10px] sm:text-xs flex-1"
                                        onClick={() => openViewModal(student)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="font-ubuntu text-[10px] sm:text-xs flex-1"
                                        onClick={() => openEditModal(student)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                                <div className="flex gap-1.5 sm:gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="default"
                                        className="font-ubuntu text-[10px] sm:text-xs flex-1"
                                        onClick={() => openAnalyticsModal(student)}
                                    >
                                        Analytics
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        className="font-ubuntu text-[10px] sm:text-xs flex-1"
                                        onClick={() => openDeleteModal(student)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1 sm:py-1.5">
                                    <span className="text-[10px] font-ubuntu text-gray-600 dark:text-gray-300">
                                        Email Verified
                                    </span>
                                    <Switch
                                        isSelected={student.emailVerificationStatus}
                                        isDisabled={togglingId === student._id}
                                        size="sm"
                                        color="success"
                                        onChange={() => handleToggleEmailVerification(student)}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <Button
                        size="sm"
                        isDisabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="font-ubuntu text-xs sm:text-sm"
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-2 sm:px-4 text-xs sm:text-sm font-ubuntu text-gray-600 dark:text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        size="sm"
                        isDisabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="font-ubuntu text-xs sm:text-sm"
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Delete Modal */}
            <Modal backdrop="opaque" isOpen={isOpen} onClose={() => { onClose(); setDeletePassword(""); }} size="sm">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <WarningIcon fillColor="red" />
                            <span className="font-ubuntu text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                                Delete Student
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-ubuntu mt-1">
                            Permanently delete{" "}
                            <span className="font-bold text-purple-500">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>?
                        </p>
                    </ModalHeader>

                    <ModalBody>
                        <ul className="w-full bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1 mb-3">
                            {[
                                "This action cannot be undone.",
                                "All student data will be permanently removed.",
                                "Enrollment records will be deleted.",
                                "Progress and bookmarks will be lost.",
                            ].map((msg, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <span className="text-red-500 font-bold">!</span>
                                    {msg}
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-col gap-2">
                            <p className="text-xs sm:text-sm font-ubuntu text-gray-600 dark:text-gray-400">
                                Enter your <span className="font-bold text-red-500">password</span> to confirm
                            </p>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                classNames={{ input: "font-ubuntu text-xs sm:text-sm" }}
                                size="sm"
                            />
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="default" onPress={() => { onClose(); setDeletePassword(""); }} size="sm">
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            variant="solid"
                            isDisabled={deletePassword.length < 8}
                            onClick={handleDeleteConfirm}
                            size="sm"
                        >
                            Confirm Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit Student Modal */}
            <Modal backdrop="opaque" isOpen={isEditOpen} onClose={onEditClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Edit Student
                        </span>
                    </ModalHeader>

                    <ModalBody>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <Input
                                label="First Name"
                                value={editForm.firstName}
                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Last Name"
                                value={editForm.lastName}
                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Username"
                                value={editForm.userName}
                                onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={editForm.userDob}
                                onChange={(e) => setEditForm({ ...editForm, userDob: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Phone Code"
                                placeholder="+91"
                                value={editForm.phoneCode}
                                onChange={(e) => setEditForm({ ...editForm, phoneCode: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Phone Number"
                                placeholder="1234567890"
                                value={editForm.phoneNumber}
                                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Country"
                                value={editForm.country}
                                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="State"
                                value={editForm.state}
                                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="City"
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="Bio"
                                placeholder="Student bio..."
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                maxRows={3}
                                size="sm"
                            />
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="default" onPress={onEditClose} size="sm">
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            variant="solid"
                            onClick={handleUpdateStudent}
                            size="sm"
                        >
                            Update Student
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* View Student Details Modal */}
            <Modal backdrop="opaque" isOpen={isViewOpen} onClose={onViewClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Student Details
                        </span>
                    </ModalHeader>

                    <ModalBody>
                        {selectedStudent && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Image
                                        src={selectedStudent.profileImageUrl || "https://via.placeholder.com/80"}
                                        alt={selectedStudent.firstName}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold font-ubuntu">
                                            {selectedStudent.firstName} {selectedStudent.lastName}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-ubuntu">
                                            @{selectedStudent.userName}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Email</p>
                                        <p className="text-sm font-ubuntu">{selectedStudent.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Unique ID</p>
                                        <p className="text-sm font-ubuntu">{selectedStudent.uniqueId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Email Verified</p>
                                        <Chip size="sm" color={selectedStudent.emailVerificationStatus ? "success" : "danger"}>
                                            {selectedStudent.emailVerificationStatus ? "Yes" : "No"}
                                        </Chip>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Phone Verified</p>
                                        <Chip size="sm" color={selectedStudent.phoneNumberVerificationStatus ? "success" : "danger"}>
                                            {selectedStudent.phoneNumberVerificationStatus ? "Yes" : "No"}
                                        </Chip>
                                    </div>
                                    {selectedStudent.phoneNumber && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Phone</p>
                                            <p className="text-sm font-ubuntu">{selectedStudent.phoneNumber.code} {selectedStudent.phoneNumber.number}</p>
                                        </div>
                                    )}
                                    {selectedStudent.userDob && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Date of Birth</p>
                                            <p className="text-sm font-ubuntu">{selectedStudent.userDob}</p>
                                        </div>
                                    )}
                                    {selectedStudent.address && (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">City</p>
                                                <p className="text-sm font-ubuntu">{selectedStudent.address.city}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Country</p>
                                                <p className="text-sm font-ubuntu">{selectedStudent.address.country}</p>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Enrolled Courses</p>
                                        <p className="text-sm font-ubuntu">{selectedStudent.enrolledIn?.length || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Joined</p>
                                        <p className="text-sm font-ubuntu">{new Date(selectedStudent.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {selectedStudent.bio && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu mb-1">Bio</p>
                                        <p className="text-sm font-ubuntu bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                            {selectedStudent.bio}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button color="default" onPress={onViewClose} size="sm">
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* View Enrolled Courses Modal */}
            <Modal backdrop="opaque" isOpen={isCoursesOpen} onClose={onCoursesClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Enrolled Courses
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        {selectedStudent && (
                            <div className="flex flex-col gap-3">
                                {selectedStudent.enrolledIn && selectedStudent.enrolledIn.length > 0 ? (
                                    selectedStudent.enrolledIn.map((courseId, i) => (
                                        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <p className="text-xs sm:text-sm font-ubuntu text-gray-700 dark:text-gray-300">Course ID: {courseId}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-ubuntu text-center py-4">
                                        No courses enrolled yet.
                                    </p>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={onCoursesClose} size="sm">
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Bulk Delete Modal */}
            <Modal backdrop="opaque" isOpen={isBulkDeleteOpen} onClose={onBulkDeleteClose} size="sm">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold text-red-500">
                            Delete Selected Students
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-ubuntu">
                                Are you sure you want to delete <span className="font-bold text-red-500">{selectedStudents.size}</span> student(s)? This action cannot be undone.
                            </p>
                            <Input
                                type="password"
                                label="Admin Password"
                                placeholder="Enter your password to confirm"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                classNames={{
                                    input: "font-ubuntu text-xs sm:text-sm",
                                    inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                }}
                                size="sm"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={onBulkDeleteClose} size="sm">
                            Cancel
                        </Button>
                        <Button color="danger" onPress={handleBulkDelete} size="sm">
                            Delete {selectedStudents.size} Student(s)
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Advanced Filters Modal */}
            <Modal backdrop="opaque" isOpen={isFilterOpen} onClose={onFilterClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Advanced Filters
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    label="Country"
                                    placeholder="Filter by country"
                                    value={filterCountry}
                                    onChange={(e) => setFilterCountry(e.target.value)}
                                    classNames={{
                                        input: "font-ubuntu text-xs sm:text-sm",
                                        inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                    }}
                                    size="sm"
                                />
                                <Input
                                    label="City"
                                    placeholder="Filter by city"
                                    value={filterCity}
                                    onChange={(e) => setFilterCity(e.target.value)}
                                    classNames={{
                                        input: "font-ubuntu text-xs sm:text-sm",
                                        inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                    }}
                                    size="sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    type="date"
                                    label="Joined From"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    classNames={{
                                        input: "font-ubuntu text-xs sm:text-sm",
                                        inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                    }}
                                    size="sm"
                                />
                                <Input
                                    type="date"
                                    label="Joined To"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    classNames={{
                                        input: "font-ubuntu text-xs sm:text-sm",
                                        inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                    }}
                                    size="sm"
                                />
                            </div>
                            <Select
                                label="Enrollment Status"
                                placeholder="Select enrollment status"
                                selectedKeys={filterEnrolled ? [filterEnrolled] : []}
                                onSelectionChange={(keys) => setFilterEnrolled(Array.from(keys)[0] as string)}
                                classNames={{
                                    trigger: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                }}
                                size="sm"
                            >
                                <SelectItem key="">All</SelectItem>
                                <SelectItem key="yes">Enrolled</SelectItem>
                                <SelectItem key="no">Not Enrolled</SelectItem>
                            </Select>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Select
                                    label="Sort By"
                                    placeholder="Select field to sort"
                                    selectedKeys={[sortBy]}
                                    onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                                    classNames={{
                                        trigger: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                    }}
                                    size="sm"
                                >
                                    <SelectItem key="createdAt">Join Date</SelectItem>
                                    <SelectItem key="firstName">First Name</SelectItem>
                                    <SelectItem key="lastName">Last Name</SelectItem>
                                    <SelectItem key="email">Email</SelectItem>
                                </Select>
                                <Select
                                    label="Sort Order"
                                    placeholder="Select order"
                                    selectedKeys={[sortOrder]}
                                    onSelectionChange={(keys) => setSortOrder(Array.from(keys)[0] as "asc" | "desc")}
                                    classNames={{
                                        trigger: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                    }}
                                    size="sm"
                                >
                                    <SelectItem key="asc">Ascending</SelectItem>
                                    <SelectItem key="desc">Descending</SelectItem>
                                </Select>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={clearFilters} size="sm">
                            Clear All
                        </Button>
                        <Button color="primary" onPress={applyFilters} size="sm">
                            Apply Filters
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Analytics Modal */}
            <Modal backdrop="opaque" isOpen={isAnalyticsOpen} onClose={onAnalyticsClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Student Analytics
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        {selectedStudent && (
                            <div className="flex flex-col gap-3 sm:gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4">
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-ubuntu">Enrolled Courses</p>
                                        <p className="text-xl sm:text-2xl font-bold font-ubuntu text-indigo-600 dark:text-indigo-400">
                                            {selectedStudent.enrolledIn?.length || 0}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 sm:p-4">
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-ubuntu">Email Status</p>
                                        <p className={`text-xl sm:text-2xl font-bold font-ubuntu ${selectedStudent.emailVerificationStatus ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                            }`}>
                                            {selectedStudent.emailVerificationStatus ? "Verified" : "Unverified"}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4">
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-ubuntu">Phone Status</p>
                                        <p className={`text-xl sm:text-2xl font-bold font-ubuntu ${selectedStudent.phoneNumberVerificationStatus ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                                            }`}>
                                            {selectedStudent.phoneNumberVerificationStatus ? "Verified" : "Not Set"}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-3 sm:p-4">
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-ubuntu">Member Since</p>
                                        <p className="text-base sm:text-lg font-bold font-ubuntu text-orange-600 dark:text-orange-400">
                                            {new Date(selectedStudent.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 sm:p-4">
                                    <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 font-ubuntu mb-2">Profile Completion</p>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(100, (
                                                    (selectedStudent.firstName ? 20 : 0) +
                                                    (selectedStudent.lastName ? 20 : 0) +
                                                    (selectedStudent.emailVerificationStatus ? 20 : 0) +
                                                    (selectedStudent.phoneNumberVerificationStatus ? 20 : 0) +
                                                    (selectedStudent.bio ? 20 : 0)
                                                ))}%`
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-ubuntu mt-2">
                                        {Math.min(100, (
                                            (selectedStudent.firstName ? 20 : 0) +
                                            (selectedStudent.lastName ? 20 : 0) +
                                            (selectedStudent.emailVerificationStatus ? 20 : 0) +
                                            (selectedStudent.phoneNumberVerificationStatus ? 20 : 0) +
                                            (selectedStudent.bio ? 20 : 0)
                                        ))}% Complete
                                    </p>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={onAnalyticsClose} size="sm">
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Send Notification Modal */}
            <Modal backdrop="opaque" isOpen={isNotificationOpen} onClose={onNotificationClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Send Notification
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-ubuntu">
                                Send notification to <span className="font-bold text-purple-500">{selectedStudents.size}</span> selected student(s)
                            </p>
                            <Input
                                label="Subject"
                                placeholder="Notification subject"
                                value={notificationSubject}
                                onChange={(e) => setNotificationSubject(e.target.value)}
                                classNames={{
                                    input: "font-ubuntu text-xs sm:text-sm",
                                    inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                }}
                                size="sm"
                            />
                            <Textarea
                                label="Message"
                                placeholder="Type your notification message..."
                                value={notificationMessage}
                                onChange={(e) => setNotificationMessage(e.target.value)}
                                minRows={4}
                                classNames={{
                                    input: "font-ubuntu text-xs sm:text-sm",
                                    inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                }}
                                size="sm"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={onNotificationClose} size="sm">
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleSendNotification}
                            isDisabled={!notificationSubject || !notificationMessage}
                            size="sm"
                        >
                            Send Notification
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Activity Logs Modal */}
            <Modal backdrop="opaque" isOpen={isActivityOpen} onClose={onActivityClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Activity Logs
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        {selectedStudent && (
                            <div className="flex flex-col gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <div className="flex-1">
                                        <p className="text-xs sm:text-sm font-ubuntu text-gray-700 dark:text-gray-300">
                                            Account created
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-ubuntu">
                                            {new Date(selectedStudent.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                {selectedStudent.emailVerificationStatus && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        <div className="flex-1">
                                            <p className="text-xs sm:text-sm font-ubuntu text-gray-700 dark:text-gray-300">
                                                Email verified
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-ubuntu">
                                                Recently
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {selectedStudent.phoneNumberVerificationStatus && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center gap-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                        <div className="flex-1">
                                            <p className="text-xs sm:text-sm font-ubuntu text-gray-700 dark:text-gray-300">
                                                Phone verified
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-ubuntu">
                                                Recently
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {selectedStudent.enrolledIn && selectedStudent.enrolledIn.length > 0 && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center gap-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                        <div className="flex-1">
                                            <p className="text-xs sm:text-sm font-ubuntu text-gray-700 dark:text-gray-300">
                                                Enrolled in {selectedStudent.enrolledIn.length} course(s)
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-ubuntu">
                                                Recently
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={onActivityClose} size="sm">
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Notes Modal */}
            <Modal backdrop="opaque" isOpen={isNotesOpen} onClose={onNotesClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Student Notes
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        {selectedStudent && (
                            <div className="flex flex-col gap-4">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-ubuntu">
                                    Notes for <span className="font-bold text-purple-500">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                                </p>
                                <Textarea
                                    placeholder="Add notes about this student..."
                                    value={studentNotes[selectedStudent._id] || ""}
                                    onChange={(e) => setStudentNotes({ ...studentNotes, [selectedStudent._id]: e.target.value })}
                                    minRows={6}
                                    classNames={{
                                        input: "font-ubuntu text-xs sm:text-sm",
                                        inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                    }}
                                    size="sm"
                                />
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={onNotesClose} size="sm">
                            Cancel
                        </Button>
                        <Button color="primary" onPress={saveNotes} size="sm">
                            Save Notes
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Add Student Modal */}
            <Modal backdrop="opaque" isOpen={isAddOpen} onClose={onAddClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Add New Student
                        </span>
                    </ModalHeader>

                    <ModalBody>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <Input
                                label="First Name *"
                                value={addForm.firstName}
                                onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                isRequired
                                size="sm"
                            />
                            <Input
                                label="Last Name"
                                value={addForm.lastName}
                                onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Username *"
                                value={addForm.userName}
                                onChange={(e) => setAddForm({ ...addForm, userName: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                isRequired
                                size="sm"
                            />
                            <Input
                                label="Email *"
                                type="email"
                                value={addForm.email}
                                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                isRequired
                                size="sm"
                            />
                            <Input
                                label="Password *"
                                type="password"
                                value={addForm.password}
                                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                isRequired
                                size="sm"
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={addForm.userDob}
                                onChange={(e) => setAddForm({ ...addForm, userDob: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Phone Code"
                                placeholder="+91"
                                value={addForm.phoneCode}
                                onChange={(e) => setAddForm({ ...addForm, phoneCode: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Phone Number"
                                placeholder="1234567890"
                                value={addForm.phoneNumber}
                                onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="Country"
                                value={addForm.country}
                                onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="State"
                                value={addForm.state}
                                onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                            <Input
                                label="City"
                                value={addForm.city}
                                onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="Bio"
                                placeholder="Student bio..."
                                value={addForm.bio}
                                onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                maxRows={3}
                                size="sm"
                            />
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="default" onPress={onAddClose} size="sm">
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            variant="solid"
                            onClick={handleAddStudent}
                            isDisabled={!addForm.firstName || !addForm.userName || !addForm.email || !addForm.password}
                            size="sm"
                        >
                            Add Student
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </motion.div>
    );
};

export default StudentsManagement;
