import React, { useState, useEffect } from "react";
import RatingComponent from "../RatingComponent";
import { Chip, Image, Button, Switch } from "@nextui-org/react";
import FavoriteIcon from "@/Icons/FavoriteIcon";
import PercentageOffIcon from "@/Icons/PercentageOffIcon";
import { ICourseData } from "@/constants";
import { useAuthContext } from "@/context/authContext";
import YoutubeIcon from "@/Icons/YoutubeIcon";
import { Link, useLocation, useNavigate } from "react-router-dom";
import RedirectLinkIcon from "@/Icons/RedirectLinkIcon";
import { getVerifiedToken } from "@/lib/cookieService";
import axios from "axios";
import { COURSE_API, USER_API } from "@/lib/env";
import { ErrorToast, SuccessToast, WarningToast } from "@/lib/toasts";

interface DisplayCourseCardIntoPageProps {
  courseData: ICourseData;
  previewImage: string;
}
const DisplayCourseCardIntoPage: React.FC<DisplayCourseCardIntoPageProps> = ({
  courseData,
  previewImage,
}) => {
  
  const { userData } = useAuthContext();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courseId = queryParams.get("c");
  const navigate = useNavigate();
  
  // State management for enrollment
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  // Check if user is already enrolled
  useEffect(() => {
    if (userData?.enrolledIn?.includes(courseData.courseId)) {
      setIsEnrolled(true);
    } else {
      setIsEnrolled(false);
    }
  }, [userData?.enrolledIn, courseData.courseId]);

  async function handleEnrolledRequest() {
    const jwt = getVerifiedToken();
    if(!jwt){
      navigate("/login");
      WarningToast("Login Required")
      return;
    }

    // Prevent re-enrollment
    if (isEnrolled) {
      SuccessToast("You are already enrolled in this course!");
      return;
    }

    setIsEnrolling(true);
    try {
      const response = await axios.post(
        `${COURSE_API}/enroll-in-course`,
        { courseId },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.data && response.data.success) {
        setIsEnrolled(true);
        SuccessToast(response.data.message);
        setTimeout(() => {
          WarningToast("View your Dashboard");
        }, 500);
      } else {
        console.log("this hits")
        ErrorToast(response.data.message);
        WarningToast("Go to your Dashboard");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Something went wrong");
      WarningToast("Go to your Dashboard");
    } finally {
      setIsEnrolling(false);
    }
  }

  async function handleUnenrollToggle() {
    const jwt = getVerifiedToken();
    if (!jwt) {
      navigate("/login");
      WarningToast("Login Required");
      return;
    }

    if (!isEnrolled) {
      return;
    }

    setIsUnenrolling(true);
    try {
      const response = await axios.post(
        `${USER_API}/unenrolled-in-course`,
        { courseId },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.data && response.data.success) {
        setIsEnrolled(false);
        SuccessToast(response.data.message);
      } else {
        ErrorToast(response.data.message);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to unenroll from course");
    } finally {
      setIsUnenrolling(false);
    }
  }
  
  return (
    <div className="md:w-1/3 sm:w-3/4 w-full p-6 border-l mx-auto">
      <div className="w-full relative bg-white text-start dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
        <div className="relative w-full">
          <Image
            isBlurred
            src={previewImage}
            alt="course-img"
            className="z-0 object-cover aspect-video rounded-tr-[6rem] p-2"
          />
          <div className="absolute right-2 bottom-[-1rem] dark:bg-gray-600/50 backdrop-blur-lg bg-white/50 p-2 rounded-xl rounded-br-[2rem] rounded-bl-[2rem] shadow-lg text-xl font-libre font-semibold flex gap-1">
            {courseData.sellingPrice === 0 ? (
              <span className="text-xl px-1 font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-teal-400 to-blue-500">
                FREE
              </span>
            ) : (
              <>
                <span className="text-xl font-libre font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  {courseData.currency && (courseData.currency.includes("INR") || courseData.currency.includes("₹")) ? "₹" : (courseData.currency === "$" ? "$" : "₹")}
                </span>
                <span className="dark:text-violet-100  text-gray-950">
                  {courseData.sellingPrice}
                </span>
              </>
            )}
          </div>
          <label className="absolute top-2 right-2">
            <FavoriteIcon fillColor={"rgb(239 68 68)"} />
          </label>
        </div>

        <div className="md:p-3 p-1 space-y-2 flex flex-col justify-between">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            {courseData.courseName}
          </h2>

          <h4 className="text-lg text-gray-600 dark:text-white font-ubuntu">
            {courseData.tutorName}
          </h4>

          <i className="text-gray-600 dark:text-gray-400 text-sm font-extralight font-libre line-clamp-3">
            {courseData.description}
          </i>

          <div className="flex justify-between items-center md:flex-row flex-col">
            <div className="flex justify-start items-center gap-2">
              <RatingComponent rating={courseData.rating} />
              <span className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                ({courseData.ratingCount})
              </span>
            </div>

            <Chip
              startContent={<PercentageOffIcon fillColor="green" size={24} />}
              variant="faded"
              color="success"
              className="font-libre text-sm"
            >
              {courseData.originalPrice === courseData.sellingPrice
                ? 100
                : (
                    ((courseData.originalPrice - courseData.sellingPrice) /
                      courseData.originalPrice) *
                    100
                  ).toFixed(2)}
              {"% "}
              <span className="font-ubuntu">Off</span>
            </Chip>
          </div>

          {courseData.uploadedBy === userData.id ? (
            courseData.courseType === "YOUTUBE" ? (
              <Button className="w-full font-medium text-lg font-ubuntu bg-blue-500 text-white hover:bg-blue-600" onClick={() => navigate(`/user/add-videos?c=${courseData.courseId}&name=${courseData.courseName}`)}>
                  <YoutubeIcon fillColor="white" size={30} /> Manage Uploads
                </Button>
            ) : courseData.courseType === "REDIRECT" &&
              courseData.redirectLink ? (
              <Link
                to={courseData.redirectLink}
                className="w-full mt-2"
                target="_blank"
              >
                <Button className="w-full font-medium text-lg font-ubuntu bg-blue-500 text-white hover:bg-blue-600">
                  <RedirectLinkIcon fillColor="white" size={30} /> Visit Now
                </Button>
              </Link>
            ) : (
           
                <Button className="w-full font-medium text-lg font-ubuntu bg-blue-500 text-white hover:bg-blue-600" onClick={() => navigate(`/user/add-videos?c=${courseData.courseId}&name=${courseData.courseName}`)}>
                  <YoutubeIcon fillColor="white" size={30} /> Manage Uploads
                </Button>
              
            )
          ) : courseData.courseType === "YOUTUBE" ? (
            // YouTube Enrollment Status
            isEnrolled ? (
              <div className="w-full p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border-2 border-green-300 dark:border-green-600 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-ubuntu font-semibold text-green-700 dark:text-green-300 text-lg">Enrolled ✓</span>
                </div>
                <Switch
                  isSelected={true}
                  disabled={isUnenrolling}
                  isDisabled={isUnenrolling}
                  color="success"
                  onChange={handleUnenrollToggle}
                  classNames={{
                    base: "flex-shrink-0 cursor-pointer",
                    wrapper: "group-data-[selected=true]:bg-green-500",
                  }}
                />
              </div>
            ) : (
              <Button
                className="w-full font-medium text-lg font-ubuntu bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                onClick={handleEnrolledRequest}
                isLoading={isEnrolling}
              >
                <YoutubeIcon fillColor="white" size={30} /> {isEnrolling ? "Enrolling..." : "Enroll Now"}
              </Button>
            )
          ) : courseData.courseType === "REDIRECT" &&
            courseData.redirectLink ? (
            <Link
              to={courseData.redirectLink}
              className="w-full mt-2"
              target="_blank"
            >
              <Button className="w-full font-medium text-lg font-ubuntu bg-blue-500 text-white hover:bg-blue-600">
                <RedirectLinkIcon fillColor="white" size={30} /> Visit Now
              </Button>
            </Link>
          ) : (
            courseData.sellingPrice === 0 ? (
              // Free Course Enrollment
              isEnrolled ? (
                <div className="w-full p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border-2 border-green-300 dark:border-green-600 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-ubuntu font-semibold text-green-700 dark:text-green-300 text-lg">Enrolled ✓</span>
                  </div>
                  <Switch
                    isSelected={true}
                    disabled={isUnenrolling}
                    isDisabled={isUnenrolling}
                    color="success"
                    onChange={handleUnenrollToggle}
                    classNames={{
                      base: "flex-shrink-0 cursor-pointer",
                      wrapper: "group-data-[selected=true]:bg-green-500",
                    }}
                  />
                </div>
              ) : (
                <Button
                  className="w-full font-medium text-lg font-ubuntu bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                  onClick={handleEnrolledRequest}
                  isLoading={isEnrolling}
                >
                  {courseData.courseType === "YOUTUBE" ? (<YoutubeIcon fillColor="white" size={30} />) : (<Image src="/logo/logo.png" className="aspect-square size-8"/>)} {isEnrolling ? "Enrolling..." : "Enroll Now"}
                </Button>
              )
            ):
            <Button className="w-full font-medium text-lg font-ubuntu bg-blue-500 text-white hover:bg-blue-600">
            <Image src="/logo/logo.png" className="aspect-square size-8"/>
                Buy Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisplayCourseCardIntoPage;
