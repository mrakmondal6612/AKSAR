import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Image, Chip } from "@nextui-org/react";
import { IUserCourseData } from "@/constants";
import { motion } from "framer-motion";
import RatingComponent from "../RatingComponent";
import YoutubeIcon from "@/Icons/YoutubeIcon";
import RedirectLinkIcon from "@/Icons/RedirectLinkIcon";
import { useNavigate } from "react-router-dom";

interface CourseDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  course: IUserCourseData | null;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  isOpen,
  onOpenChange,
  course,
}) => {
  const navigate = useNavigate();

  if (!course) return null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      backdrop="blur"
      classNames={{
        base: "bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-gray-950 dark:via-gray-900 dark:to-black",
        header: "border-b-[1px] border-default-200/50",
        footer: "border-t-[1px] border-default-200/50",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                {course.courseName}
              </h2>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-4">
                {/* Course Image */}
                <div className="relative w-full h-64 rounded-xl overflow-hidden">
                  <Image
                    isBlurred
                    src={course.thumbnail}
                    alt={course.courseName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Course Type Badge */}
                <div className="flex gap-2">
                  <Chip
                    startContent={
                      course.courseType === "YOUTUBE" ? (
                        <YoutubeIcon fillColor="white" size={16} />
                      ) : course.courseType === "REDIRECT" ? (
                        <RedirectLinkIcon fillColor="white" />
                      ) : (
                        <span>📚</span>
                      )
                    }
                    variant="flat"
                    className="bg-blue-500/20 text-blue-300"
                  >
                    {course.courseType}
                  </Chip>

                  {course.sellingPrice === 0 && (
                    <Chip
                      variant="flat"
                      className="bg-green-500/20 text-green-300"
                    >
                      🎁 FREE
                    </Chip>
                  )}
                </div>

                {/* Tutor Info */}
                <div className="bg-default-100/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-400">Instructor</p>
                  <h3 className="text-xl font-semibold text-white">
                    {course.tutorName}
                  </h3>
                </div>

                {/* Rating & Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-default-100/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-400">Rating</p>
                    <div className="flex items-center gap-2">
                      <RatingComponent rating={course.rating ?? 0} />
                      <span className="text-white font-semibold">
                        {course.rating?.toFixed(1) ?? "N/A"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      ({course.ratingCount} reviews)
                    </p>
                  </div>

                  <div className="bg-default-100/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-400">Price</p>
                    {course.sellingPrice === 0 ? (
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-teal-400 to-blue-500">
                        FREE
                      </p>
                    ) : (() => {
                      const currencySymbol = course.currency && (course.currency.includes("INR") || course.currency.includes("₹")) ? "₹" : (course.currency === "$" ? "$" : "₹");
                      const discount = Math.round(((course.originalPrice - course.sellingPrice) / course.originalPrice) * 100);
                      const savings = course.originalPrice - course.sellingPrice;
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-baseline gap-2.5">
                            <p className="text-2xl font-bold text-white">
                              {currencySymbol}{course.sellingPrice}
                            </p>
                            {course.originalPrice > course.sellingPrice && (
                              <p className="text-sm text-gray-500 line-through">
                                {currencySymbol}{course.originalPrice}
                              </p>
                            )}
                          </div>
                          {course.originalPrice > course.sellingPrice && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-500">
                                {discount}% OFF
                              </span>
                              <span className="text-[11px] sm:text-xs font-semibold text-green-400">
                                Save {currencySymbol}{savings}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-default-100/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-white text-sm leading-relaxed">
                    {course.description || "No description available"}
                  </p>
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-default-100/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                      {(course as any).videoCount || "—"}
                    </p>
                    <p className="text-xs text-gray-400">Videos</p>
                  </div>
                  <div className="bg-default-100/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                      {(course as any).enrolledCount || "—"}
                    </p>
                    <p className="text-xs text-gray-400">Enrolled</p>
                  </div>
                  <div className="bg-default-100/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                      {(course as any).isVerified ? "✓" : "✕"}
                    </p>
                    <p className="text-xs text-gray-400">Verified</p>
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={onClose}
                className="font-medium"
              >
                Close
              </Button>
              <Button
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold"
                onPress={() => {
                  onClose();
                  navigate(`/course-intro-page?c=${course.courseId}`);
                }}
              >
                {course.courseType === "YOUTUBE" ? (
                  <>
                    <YoutubeIcon fillColor="white" size={20} /> Watch Now
                  </>
                ) : (
                  <>Enroll Now</>
                )}
              </Button>
            </ModalFooter>
          </motion.div>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CourseDetailsModal;
