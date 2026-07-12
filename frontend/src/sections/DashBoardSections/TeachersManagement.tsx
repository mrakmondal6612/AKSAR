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
} from "@nextui-org/react";
import axios from "axios";
import { USER_API } from "@/lib/env";
import { getVerifiedToken } from "@/lib/cookieService";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import TeacherIcon from "@/Icons/TeacherIcon";
import FilterIcon from "@/Icons/FilterIcon";
import WarningIcon from "@/Icons/WarningIcon";
import VerificationIcon from "@/Icons/VerificationIcon";

interface ITeacher {
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
    specialization?: string[];
    experience?: number;
    createdAt: string;
}

interface ITeacherStats {
    totalTeachers: number;
    verifiedEmails: number;
    verifiedPhones: number;
    recentTeachers: ITeacher[];
}

const TeachersManagement: React.FC = () => {
    const [teachers, setTeachers] = React.useState<ITeacher[]>([]);
    const [stats, setStats] = React.useState<ITeacherStats | null>(null);
    const [filtered, setFiltered] = React.useState<ITeacher[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [activeFilter, setActiveFilter] = React.useState("All");
    const [selectedTeacher, setSelectedTeacher] = React.useState<ITeacher | null>(null);
    const [deletePassword, setDeletePassword] = React.useState("");
    const [togglingId, setTogglingId] = React.useState<string | null>(null);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

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
        specialization: "",
        experience: "",
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
        specialization: "",
        experience: "",
    });

    const fetchTeachers = React.useCallback(async () => {
        setLoading(true);
        const jwt = getVerifiedToken();
        try {
            const res = await axios.get(`${USER_API}/admin/teachers?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.data?.success) {
                setTeachers(res.data.data);
                setFiltered(res.data.data);
                setTotalPages(res.data.pagination?.pages || 1);
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to fetch teachers");
        } finally {
            setLoading(false);
        }
    }, [page]);

    const fetchStats = React.useCallback(async () => {
        const jwt = getVerifiedToken();
        try {
            const res = await axios.get(`${USER_API}/admin/teachers/stats`, {
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
        fetchTeachers();
        fetchStats();
    }, [fetchTeachers, fetchStats]);

    React.useEffect(() => {
        let result = teachers;
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
    }, [search, activeFilter, teachers]);

    const handleToggleEmailVerification = async (teacher: ITeacher) => {
        setTogglingId(teacher._id);
        const jwt = getVerifiedToken();
        try {
            const res = await axios.patch(
                `${USER_API}/admin/teachers/${teacher._id}/email-verification`,
                {},
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );
            if (res.data?.success) {
                SuccessToast(res.data.message);
                setTeachers((prev) =>
                    prev.map((s) =>
                        s._id === teacher._id
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
        if (!selectedTeacher || !deletePassword) return;
        const jwt = getVerifiedToken();
        try {
            const res = await axios.delete(
                `${USER_API}/admin/teachers/${selectedTeacher._id}`,
                {
                    data: { password: deletePassword },
                    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
                }
            );
            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchTeachers();
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

    const openDeleteModal = (teacher: ITeacher) => {
        setSelectedTeacher(teacher);
        setDeletePassword("");
        onOpen();
    };

    const openEditModal = (teacher: ITeacher) => {
        setSelectedTeacher(teacher);
        setEditForm({
            firstName: teacher.firstName,
            lastName: teacher.lastName || "",
            userName: teacher.userName,
            email: teacher.email,
            bio: teacher.bio || "",
            userDob: teacher.userDob || "",
            country: teacher.address?.country || "",
            state: teacher.address?.state || "",
            city: teacher.address?.city || "",
            phoneCode: teacher.phoneNumber?.code || "",
            phoneNumber: teacher.phoneNumber?.number || "",
            specialization: teacher.specialization?.join(", ") || "",
            experience: teacher.experience?.toString() || "",
        });
        onEditOpen();
    };

    const handleUpdateTeacher = async () => {
        if (!selectedTeacher) return;
        const jwt = getVerifiedToken();
        try {
            const updateData: any = {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                userName: editForm.userName,
                email: editForm.email,
                bio: editForm.bio,
                userDob: editForm.userDob,
                specialization: editForm.specialization.split(",").map(s => s.trim()).filter(s => s),
                experience: parseInt(editForm.experience) || 0,
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
                `${USER_API}/admin/teachers/${selectedTeacher._id}`,
                updateData,
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );

            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchTeachers();
                onEditClose();
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to update teacher");
        }
    };

    const openViewModal = (teacher: ITeacher) => {
        setSelectedTeacher(teacher);
        onViewOpen();
    };

    const handleAddTeacher = async () => {
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
                specialization: addForm.specialization.split(",").map(s => s.trim()).filter(s => s),
                experience: parseInt(addForm.experience) || 0,
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
                `${USER_API}/admin/teachers`,
                createData,
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );

            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchTeachers();
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
                    specialization: "",
                    experience: "",
                });
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to add teacher");
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
                    <TeacherIcon fillColor="rgb(139 92 246)" size={24} />
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        Teachers Management
                    </h1>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {stats && [
                    { label: "Total Teachers", value: stats.totalTeachers, color: "from-indigo-500 to-purple-500" },
                    { label: "Verified Emails", value: stats.verifiedEmails, color: "from-green-400 to-emerald-500" },
                    { label: "Verified Phones", value: stats.verifiedPhones, color: "from-blue-400 to-cyan-500" },
                    { label: "Recent", value: stats.recentTeachers?.length || 0, color: "from-orange-400 to-amber-500" },
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
                        + Add Teacher
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
                </div>
            </div>

            {/* Results count */}
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-ubuntu">
                Showing <span className="font-bold text-purple-500">{filtered.length}</span> of {teachers.length} teachers
            </p>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="w-full flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
                    <TeacherIcon fillColor="rgb(139 92 246)" size={36} />
                    <p className="text-sm sm:text-lg font-ubuntu text-gray-500 dark:text-gray-400">
                        No teachers match your search.
                    </p>
                </div>
            )}

            {/* Teacher cards - Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filtered.map((teacher, i) => (
                    <motion.div
                        key={teacher._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className={`w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg overflow-hidden ${teacher.emailVerificationStatus
                                ? "border-gray-100 dark:border-gray-700 hover:border-purple-300"
                                : "border-red-200 dark:border-red-500/30 hover:border-red-400"
                            }`}
                    >
                        <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4">
                            {/* Header with Profile */}
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 relative">
                                    <Image
                                        isBlurred
                                        src={teacher.profileImageUrl || "https://via.placeholder.com/80"}
                                        alt={teacher.firstName}
                                        className="object-cover aspect-square rounded-xl w-full h-full"
                                    />
                                    <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-ubuntu font-bold z-10 ${teacher.emailVerificationStatus
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                    }`}>
                                        {teacher.emailVerificationStatus ? "✓" : "!"}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 line-clamp-1">
                                        {teacher.firstName} {teacher.lastName}
                                    </h2>
                                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-ubuntu line-clamp-1">
                                        @{teacher.userName}
                                    </p>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {teacher.emailVerificationStatus && (
                                            <Chip size="sm" color="success" variant="flat" className="font-ubuntu text-[10px] h-5">
                                                Email
                                            </Chip>
                                        )}
                                        {teacher.phoneNumberVerificationStatus && (
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
                                    {teacher.email}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-ubuntu">
                                    {teacher.address && (
                                        <span className="line-clamp-1">
                                            {teacher.address.city}, {teacher.address.country}
                                        </span>
                                    )}
                                    {teacher.experience && (
                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                            {teacher.experience} yrs exp
                                        </span>
                                    )}
                                </div>
                                {teacher.specialization && teacher.specialization.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                        {teacher.specialization.slice(0, 2).map((spec, idx) => (
                                            <span key={idx} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                {spec}
                                            </span>
                                        ))}
                                        {teacher.specialization.length > 2 && (
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                                +{teacher.specialization.length - 2}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-1.5 sm:gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex gap-1.5 sm:gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        className="font-ubuntu text-[10px] sm:text-xs flex-1"
                                        onClick={() => openViewModal(teacher)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="font-ubuntu text-[10px] sm:text-xs flex-1"
                                        onClick={() => openEditModal(teacher)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                                <div className="flex gap-1.5 sm:gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        className="font-ubuntu text-[10px] sm:text-xs flex-1"
                                        onClick={() => openDeleteModal(teacher)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1 sm:py-1.5">
                                    <span className="text-[10px] font-ubuntu text-gray-600 dark:text-gray-300">
                                        Email Verified
                                    </span>
                                    <Switch
                                        isSelected={teacher.emailVerificationStatus}
                                        isDisabled={togglingId === teacher._id}
                                        size="sm"
                                        color="success"
                                        onChange={() => handleToggleEmailVerification(teacher)}
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
                                Delete Teacher
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-ubuntu mt-1">
                            Permanently delete{" "}
                            <span className="font-bold text-purple-500">{selectedTeacher?.firstName} {selectedTeacher?.lastName}</span>?
                        </p>
                    </ModalHeader>

                    <ModalBody>
                        <ul className="w-full bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1 mb-3">
                            {[
                                "This action cannot be undone.",
                                "All teacher data will be permanently removed.",
                                "Associated courses may be affected.",
                                "Progress and records will be lost.",
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

            {/* Edit Teacher Modal */}
            <Modal backdrop="opaque" isOpen={isEditOpen} onClose={onEditClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Edit Teacher
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
                                label="Experience (years)"
                                type="number"
                                value={editForm.experience}
                                onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
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
                            <Input
                                label="Specialization (comma separated)"
                                placeholder="React, Node.js, Python"
                                value={editForm.specialization}
                                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="Bio"
                                placeholder="Teacher bio..."
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
                            onClick={handleUpdateTeacher}
                            size="sm"
                        >
                            Update Teacher
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* View Teacher Details Modal */}
            <Modal backdrop="opaque" isOpen={isViewOpen} onClose={onViewClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Teacher Details
                        </span>
                    </ModalHeader>

                    <ModalBody>
                        {selectedTeacher && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Image
                                        src={selectedTeacher.profileImageUrl || "https://via.placeholder.com/80"}
                                        alt={selectedTeacher.firstName}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="text-xl font-bold font-ubuntu">
                                            {selectedTeacher.firstName} {selectedTeacher.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu">
                                            @{selectedTeacher.userName}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Email</p>
                                        <p className="text-sm font-ubuntu">{selectedTeacher.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Unique ID</p>
                                        <p className="text-sm font-ubuntu">{selectedTeacher.uniqueId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Email Verified</p>
                                        <Chip size="sm" color={selectedTeacher.emailVerificationStatus ? "success" : "danger"}>
                                            {selectedTeacher.emailVerificationStatus ? "Yes" : "No"}
                                        </Chip>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Phone Verified</p>
                                        <Chip size="sm" color={selectedTeacher.phoneNumberVerificationStatus ? "success" : "danger"}>
                                            {selectedTeacher.phoneNumberVerificationStatus ? "Yes" : "No"}
                                        </Chip>
                                    </div>
                                    {selectedTeacher.phoneNumber && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Phone</p>
                                            <p className="text-sm font-ubuntu">{selectedTeacher.phoneNumber.code} {selectedTeacher.phoneNumber.number}</p>
                                        </div>
                                    )}
                                    {selectedTeacher.experience && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Experience</p>
                                            <p className="text-sm font-ubuntu">{selectedTeacher.experience} years</p>
                                        </div>
                                    )}
                                    {selectedTeacher.address && (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">City</p>
                                                <p className="text-sm font-ubuntu">{selectedTeacher.address.city}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Country</p>
                                                <p className="text-sm font-ubuntu">{selectedTeacher.address.country}</p>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu">Joined</p>
                                        <p className="text-sm font-ubuntu">{new Date(selectedTeacher.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {selectedTeacher.specialization && selectedTeacher.specialization.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu mb-1">Specialization</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {selectedTeacher.specialization.map((spec, idx) => (
                                                <Chip key={idx} size="sm" color="primary" variant="flat">
                                                    {spec}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedTeacher.bio && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-ubuntu mb-1">Bio</p>
                                        <p className="text-sm font-ubuntu bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                            {selectedTeacher.bio}
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

            {/* Add Teacher Modal */}
            <Modal backdrop="opaque" isOpen={isAddOpen} onClose={onAddClose} size="lg">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Add New Teacher
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
                                label="Experience (years)"
                                type="number"
                                value={addForm.experience}
                                onChange={(e) => setAddForm({ ...addForm, experience: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
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
                            <Input
                                label="Specialization (comma separated)"
                                placeholder="React, Node.js, Python"
                                value={addForm.specialization}
                                onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                                classNames={{ input: "font-ubuntu text-sm" }}
                                size="sm"
                            />
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="Bio"
                                placeholder="Teacher bio..."
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
                            onClick={handleAddTeacher}
                            isDisabled={!addForm.firstName || !addForm.userName || !addForm.email || !addForm.password}
                            size="sm"
                        >
                            Add Teacher
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </motion.div>
    );
};

export default TeachersManagement;
