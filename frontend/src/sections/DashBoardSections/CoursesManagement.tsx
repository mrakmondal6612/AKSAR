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
    Textarea,
    Select,
    SelectItem,
} from "@nextui-org/react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { COURSE_API } from "@/lib/env";
import { getVerifiedToken } from "@/lib/cookieService";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import { ICourseData } from "@/constants";
import CourseIcon from "@/Icons/CourseIcon";

import FilterIcon from "@/Icons/FilterIcon";
import AddIcon from "@/Icons/AddIcon";
import WarningIcon from "@/Icons/WarningIcon";
import YoutubeIcon from "@/Icons/YoutubeIcon";
import RedirectLinkIcon from "@/Icons/RedirectLinkIcon";

// ─── Extended course type with isVerified ─────────────────────────────────────
interface ICourseExtended extends ICourseData {
    isVerified?: boolean;
    enrolledCount?: number;
}

// ─── CourseTypeChip ───────────────────────────────────────────────────────────
const CourseTypeChip: React.FC<{ type: string }> = ({ type }) => {
    const map: Record<string, { label: string; cls: string }> = {
        YOUTUBE: { label: "YouTube", cls: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
        PERSONAL: { label: "Personal", cls: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" },
        REDIRECT: { label: "Redirect", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
        SEMESTER: { label: "Semester", cls: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" },
        TECH: { label: "Tech", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400" },
    };
    const { label, cls } = map[type] ?? { label: type, cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium font-ubuntu ${cls}`}>
      {label}
    </span>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CoursesManagement: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [courses, setCourses] = React.useState<ICourseExtended[]>([]);
    const [filtered, setFiltered] = React.useState<ICourseExtended[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [activeFilter, setActiveFilter] = React.useState("All");
    const [selectedCourse, setSelectedCourse] = React.useState<ICourseExtended | null>(null);
    const [deletePassword, setDeletePassword] = React.useState("");
    const [togglingId, setTogglingId] = React.useState<string | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

    // ── Fetch ALL courses ──────────────────────────────────────────────────────
    const fetchCourses = React.useCallback(async () => {
        setLoading(true);
        const jwt = getVerifiedToken();
        try {
            const res = await axios.get(`${COURSE_API}/get-admin-courses`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.data?.success) {
                setCourses(res.data.data);
                setFiltered(res.data.data);
            } else {
                ErrorToast(res.data.message);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to fetch courses");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // ── Search + Filter ────────────────────────────────────────────────────────
    React.useEffect(() => {
        let result = courses;
        if (activeFilter !== "All") {
            if (activeFilter === "ACTIVE") {
                result = result.filter((c) => c.isVerified === true);
            } else if (activeFilter === "INACTIVE") {
                result = result.filter((c) => !c.isVerified);
            } else {
                result = result.filter((c) => c.courseType === activeFilter);
            }
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.courseName.toLowerCase().includes(q) ||
                    c.tutorName.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [search, activeFilter, courses]);

    // ── Toggle isVerified ──────────────────────────────────────────────────────
    const handleToggleActive = async (course: ICourseExtended) => {
        setTogglingId(course.courseId);
        const jwt = getVerifiedToken();
        try {
            const res = await axios.patch(
                `${COURSE_API}/toggle-course-status`,
                { courseId: course.courseId, isVerified: !course.isVerified },
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );
            if (res.data?.success) {
                SuccessToast(res.data.message);
                setCourses((prev) =>
                    prev.map((c) =>
                        c.courseId === course.courseId ? { ...c, isVerified: !c.isVerified } : c
                    )
                );
            } else {
                ErrorToast(res.data.message);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to update status");
        } finally {
            setTogglingId(null);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!selectedCourse || !deletePassword) return;
        const jwt = getVerifiedToken();
        try {
            const res = await axios.post(
                `${COURSE_API}/delete-course`,
                { password: deletePassword, courseId: selectedCourse.courseId },
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );
            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchCourses();
                onClose();
                setDeletePassword("");
            } else {
                ErrorToast(res.data.message);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Something went wrong");
        }
    };

    const openDeleteModal = (course: ICourseExtended) => {
        setSelectedCourse(course);
        setDeletePassword("");
        onOpen();
    };

    // Add form state
    const [addForm, setAddForm] = React.useState({
        courseName: "",
        tutorName: "",
        courseType: "PERSONAL",
        sellingPrice: "",
        originalPrice: "",
        currency: "INR",
        description: "",
        thumbnail: "",
        redirectLink: "",
    });

    const handleAddCourse = async () => {
        const jwt = getVerifiedToken();
        try {
            const createData = {
                courseName: addForm.courseName,
                tutorName: addForm.tutorName,
                courseType: addForm.courseType,
                sellingPrice: parseFloat(addForm.sellingPrice),
                originalPrice: parseFloat(addForm.originalPrice),
                currency: addForm.currency,
                description: addForm.description,
                thumbnail: addForm.thumbnail,
                redirectLink: addForm.courseType === "REDIRECT" ? addForm.redirectLink : undefined,
            };

            const res = await axios.post(
                `${COURSE_API}/create-course`,
                createData,
                { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" } }
            );

            if (res.data?.success) {
                SuccessToast(res.data.message);
                fetchCourses();
                onAddClose();
                setAddForm({
                    courseName: "",
                    tutorName: "",
                    courseType: "PERSONAL",
                    sellingPrice: "",
                    originalPrice: "",
                    currency: "INR",
                    description: "",
                    thumbnail: "",
                    redirectLink: "",
                });
            } else {
                ErrorToast(res.data.message);
            }
        } catch (err: any) {
            ErrorToast(err?.response?.data?.message || "Failed to add course");
        }
    };

    const filters = ["All", "ACTIVE", "INACTIVE", "YOUTUBE", "PERSONAL", "REDIRECT"];

    // ── Loading skeleton ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="w-full flex flex-col gap-4 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full h-36 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
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
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <CourseIcon fillColor="rgb(139 92 246)" size={28} />
                    <h1 className="text-2xl sm:text-3xl font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        Courses Management
                    </h1>
                </div>
                <Button
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-ubuntu font-medium"
                    onClick={onAddOpen}
                >
                    <AddIcon fillColor="white" size={18} />
                    Add New Course
                </Button>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Courses", value: courses.length, color: "from-indigo-500 to-purple-500" },
                    { label: "Active", value: courses.filter((c) => c.isVerified).length, color: "from-green-400 to-emerald-500" },
                    { label: "Inactive", value: courses.filter((c) => !c.isVerified).length, color: "from-red-400 to-rose-500" },
                    { label: "YouTube", value: courses.filter((c) => c.courseType === "YOUTUBE").length, color: "from-red-400 to-red-600" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <p className={`text-2xl font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r ${stat.color}`}>
                            {stat.value}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Search + Filter ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    placeholder="Search by course name or tutor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                    classNames={{
                        input: "font-ubuntu text-sm",
                        inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                    }}
                />
                <div className="flex gap-2 flex-wrap">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-3 py-2 rounded-lg text-sm font-ubuntu font-medium transition-all duration-200 flex items-center gap-1 ${
                                activeFilter === f
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-400"
                            }`}
                        >
                            {f === "All" && <FilterIcon fillColor={activeFilter === f ? "white" : "gray"} size={14} />}
                            {f === "YOUTUBE" && <YoutubeIcon fillColor={activeFilter === f ? "white" : "red"} size={14} />}
                            {f === "REDIRECT" && <RedirectLinkIcon fillColor={activeFilter === f ? "white" : "gray"} size={14} />}
                            {f === "PERSONAL" && <CourseIcon fillColor={activeFilter === f ? "white" : "gray"} size={14} />}
                            {f === "ACTIVE" && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
                            {f === "INACTIVE" && <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />}
                            {f === "All" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Results count ── */}
            <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu">
                Showing <span className="font-bold text-purple-500">{filtered.length}</span> of {courses.length} courses
            </p>

            {/* ── Empty state ── */}
            {filtered.length === 0 && (
                <div className="w-full flex flex-col items-center justify-center py-16 gap-3">
                    <CourseIcon fillColor="rgb(139 92 246)" size={48} />
                    <p className="text-lg font-ubuntu text-gray-500 dark:text-gray-400">
                        No courses match your search.
                    </p>
                </div>
            )}

            {/* ── Course cards - Grid Layout ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((course, i) => (
                    <motion.div
                        key={course.courseId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className={`w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg overflow-hidden ${
                            course.isVerified
                                ? "border-gray-100 dark:border-gray-700 hover:border-purple-300"
                                : "border-red-200 dark:border-red-500/30 hover:border-red-400"
                        }`}
                    >
                        <div className="flex flex-col gap-3 p-4">
                            {/* Thumbnail with badge */}
                            <div className="relative">
                                <Image
                                    isBlurred
                                    src={course.thumbnail}
                                    alt={course.courseName}
                                    className="object-cover aspect-video rounded-xl w-full h-32"
                                />
                                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-ubuntu font-bold z-10 ${
                                    course.isVerified
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                }`}>
                                    {course.isVerified ? "✓" : "!"}
                                </span>
                                <CourseTypeChip type={course.courseType} />
                            </div>

                            {/* Course Info */}
                            <div className="space-y-1">
                                <h2 className="text-sm font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 line-clamp-2">
                                    {course.courseName}
                                </h2>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-ubuntu line-clamp-1">
                                    {course.tutorName}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-libre italic line-clamp-2">
                                    {course.description}
                                </p>
                            </div>

                            {/* Price and Stats */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {(() => {
                                    const currencySymbol = course.currency && (course.currency.includes("INR") || course.currency.includes("₹")) ? "₹" : (course.currency === "$" ? "$" : "₹");
                                    return (
                                        <span className="text-sm font-bold font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                                            {currencySymbol}{course.sellingPrice}
                                        </span>
                                    );
                                })()}
                                {course.enrolledCount !== undefined && (
                                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                        {course.enrolledCount} enrolled
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        className="font-ubuntu text-xs flex-1"
                                        onClick={() => navigate(`/course-intro-page?c=${course.courseId}`)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="secondary"
                                        className="font-ubuntu text-xs flex-1"
                                        onClick={() => {
                                            const prefix = location.pathname.startsWith("/admin") ? "/admin" : "/user";
                                            navigate(`${prefix}/add-videos?c=${course.courseId}&name=${encodeURIComponent(course.courseName)}`);
                                        }}
                                    >
                                        Videos
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        className="font-ubuntu text-xs flex-1"
                                        onClick={() => openDeleteModal(course)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                                    <span className="text-[10px] font-ubuntu text-gray-600 dark:text-gray-300">
                                        {course.isVerified ? "Active" : "Inactive"}
                                    </span>
                                    <Switch
                                        isSelected={course.isVerified ?? false}
                                        isDisabled={togglingId === course.courseId}
                                        size="sm"
                                        color="success"
                                        onChange={() => handleToggleActive(course)}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Delete Modal ── */}
            <Modal backdrop="opaque" isOpen={isOpen} onClose={() => { onClose(); setDeletePassword(""); }}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <WarningIcon fillColor="red" />
                            <span className="font-ubuntu text-xl font-bold text-red-600 dark:text-red-400">
                Delete Course
              </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-ubuntu mt-1">
                            Permanently delete{" "}
                            <span className="font-bold text-purple-500">{selectedCourse?.courseName}</span>?
                        </p>
                    </ModalHeader>

                    <ModalBody>
                        <ul className="w-full bg-gray-50 dark:bg-gray-900 text-sm p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1 mb-3">
                            {[
                                "This action cannot be undone.",
                                "All associated videos will be deleted.",
                                "All enrolled user data will be removed.",
                                "You will not be able to recover this course.",
                            ].map((msg, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <span className="text-red-500 font-bold">!</span>
                                    {msg}
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-ubuntu text-gray-600 dark:text-gray-400">
                                Enter your <span className="font-bold text-red-500">password</span> to confirm
                            </p>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                classNames={{ input: "font-ubuntu" }}
                            />
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="default" onPress={() => { onClose(); setDeletePassword(""); }}>
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            variant="solid"
                            isDisabled={deletePassword.length < 8}
                            onClick={handleDeleteConfirm}
                        >
                            Confirm Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ── Add Course Modal ── */}
            <Modal backdrop="opaque" isOpen={isAddOpen} onClose={onAddClose} size="2xl">
                <ModalContent>
                    <ModalHeader>
                        <span className="font-ubuntu text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            Add New Course
                        </span>
                    </ModalHeader>

                    <ModalBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Course Name *"
                                value={addForm.courseName}
                                onChange={(e) => setAddForm({ ...addForm, courseName: e.target.value })}
                                classNames={{ input: "font-ubuntu" }}
                                isRequired
                            />
                            <Input
                                label="Tutor Name *"
                                value={addForm.tutorName}
                                onChange={(e) => setAddForm({ ...addForm, tutorName: e.target.value })}
                                classNames={{ input: "font-ubuntu" }}
                                isRequired
                            />
                            <Select
                                label="Course Type *"
                                selectedKeys={[addForm.courseType]}
                                onSelectionChange={(keys) => setAddForm({ ...addForm, courseType: Array.from(keys)[0] as string })}
                                classNames={{
                                    trigger: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                }}
                            >
                                <SelectItem key="PERSONAL">Personal</SelectItem>
                                <SelectItem key="YOUTUBE">YouTube</SelectItem>
                                <SelectItem key="REDIRECT">Redirect</SelectItem>
                                <SelectItem key="SEMESTER">Semester</SelectItem>
                                <SelectItem key="TECH">Tech</SelectItem>
                            </Select>
                            <Input
                                label="Selling Price *"
                                type="number"
                                value={addForm.sellingPrice}
                                onChange={(e) => setAddForm({ ...addForm, sellingPrice: e.target.value })}
                                classNames={{ input: "font-ubuntu" }}
                                isRequired
                            />
                            <Input
                                label="Original Price"
                                type="number"
                                value={addForm.originalPrice}
                                onChange={(e) => setAddForm({ ...addForm, originalPrice: e.target.value })}
                                classNames={{ input: "font-ubuntu" }}
                            />
                            <Select
                                label="Currency"
                                selectedKeys={[addForm.currency]}
                                onSelectionChange={(keys) => setAddForm({ ...addForm, currency: Array.from(keys)[0] as string })}
                                classNames={{
                                    trigger: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                }}
                            >
                                <SelectItem key="INR">INR (₹)</SelectItem>
                                <SelectItem key="USD">USD ($)</SelectItem>
                                <SelectItem key="EUR">EUR (€)</SelectItem>
                            </Select>
                            <Input
                                label="Thumbnail URL *"
                                value={addForm.thumbnail}
                                onChange={(e) => setAddForm({ ...addForm, thumbnail: e.target.value })}
                                classNames={{ input: "font-ubuntu" }}
                                isRequired
                            />
                            {addForm.courseType === "REDIRECT" && (
                                <Input
                                    label="Redirect Link *"
                                    value={addForm.redirectLink}
                                    onChange={(e) => setAddForm({ ...addForm, redirectLink: e.target.value })}
                                    classNames={{ input: "font-ubuntu" }}
                                    isRequired
                                />
                            )}
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="Description *"
                                placeholder="Course description..."
                                value={addForm.description}
                                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                                classNames={{ input: "font-ubuntu" }}
                                maxRows={3}
                                isRequired
                            />
                        </div>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="default" onPress={onAddClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            variant="solid"
                            onClick={handleAddCourse}
                            isDisabled={!addForm.courseName || !addForm.tutorName || !addForm.sellingPrice || !addForm.thumbnail || !addForm.description}
                        >
                            Add Course
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </motion.div>
    );
};

export default CoursesManagement;