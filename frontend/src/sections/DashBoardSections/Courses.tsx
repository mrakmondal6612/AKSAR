import { motion } from 'framer-motion';
import React from 'react';
import UserCourseCard from '@/components/UserCourseCard';
import { IUserCourseData } from '@/constants';
import { getVerifiedToken } from '@/lib/cookieService';
import axios from 'axios';
import { COURSE_API } from '@/lib/env';
import { ErrorToast } from '@/lib/toasts';
import TextFlipSmoothRevealEffect from '@/Effects/TextFlipSmoothRevealEffect';
import { Button } from '@nextui-org/react';
import { useNavigate } from 'react-router-dom';

const Courses = () => {
  const [userCourses, setUserCourses] = React.useState<IUserCourseData[] | []>([]);
  const navigate = useNavigate();

  const fetchUserEnrolledCourses = React.useCallback(async () => {
    const jwt = getVerifiedToken();

    try {
      const response = await axios.get(`${COURSE_API}/get-user-enrolled-courses`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });

      if (response && response.data && response.data.success) {
        setUserCourses(response.data.data);
      }
      else {
        ErrorToast(response.data.message);
        setUserCourses([]);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast(error?.response.data.message || "Something went wrong");
      setUserCourses([]);
    }
  }, []);

  React.useEffect(() => {
    fetchUserEnrolledCourses();
  }, [fetchUserEnrolledCourses]);

  return (
    <motion.div
      className="w-full relative rounded-lg p-4 space-y-6"
      variants={{
        hidden: { opacity: 0.3, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-center items-center text-center gap-2 overflow-hidden">
        <TextFlipSmoothRevealEffect text="MY COURSES" className="sm:text-5xl text-3xl" />
      </div>

      {userCourses.length === 0 ?
        (
          <div className="w-full flex flex-col justify-center items-center gap-4 p-6 bg-yellow-100 border border-yellow-300 rounded-md shadow-md">
            <p className="text-lg font-ubuntu text-center text-yellow-800">
              Oops! It seems like you haven't enrolled in any course yet. <br />
              <Button variant="bordered" onClick={() => navigate("/courses")} className="w-full flex justify-center items-center mt-4 px-4 py-2 bg-yellow-600 text-white font-ubuntu text-sm rounded-md shadow-md hover:bg-yellow-500 transition-all duration-300 ease-in-out">
                Explore Courses
              </Button>
            </p>
          </div>
        ) : (
          <UserCourseCard courses={userCourses} />
        )
      }
    </motion.div>
  );
};

export default Courses;
