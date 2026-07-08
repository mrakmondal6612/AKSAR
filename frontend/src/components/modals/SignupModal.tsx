import React, { useState } from "react";
import { motion } from "framer-motion";
import CrossIcon from "@/Icons/CrossIcon";
import { signupSchema } from "@/validChecksSchema/zodSchemas";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "@/Icons/GoogleIcon";
import GitHubIcon from "@/Icons/GithubIcon";
import axios from "axios";
import SignUpOTPModal from "./SignUpOTPModal";
import EyeCloseIcon from "@/Icons/EyeCloseIcon";
import EyeOpenIcon from "@/Icons/EyeOpenIcon";
import {useTheme } from "@/context/ThemeProvider";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import { USER_API } from "@/lib/env";

type SignupFormData = z.infer<typeof signupSchema>;

const SignupModal: React.FC = () => {
  const navigate = useNavigate();
  const {theme} = useTheme();
  const [showOTPComponent, setShowOTPComponent] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isDisabled , setisDisabled] = useState<boolean>(false);

  const closeSignup = () => {
    navigate("/");
  };

  const {
    register,
    watch,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  
  const passwordValue = watch("password", "");
  const formData = getValues();

  const onSubmit = async (data: SignupFormData) => {
    setisDisabled(true);
    try {
      // Format the data to match backend expectations
      const formattedData: any = {
        userName: data.userName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      };

      // Add optional fields if provided
      if (data.userDob) formattedData.userDob = data.userDob;
      if (data.bio) formattedData.bio = data.bio;
      if (data.learningGoal) formattedData.learningGoal = data.learningGoal;
      if (data.experienceLevel) formattedData.experienceLevel = data.experienceLevel;

      // Format phone number
      if (data.phoneCode || data.phoneNumber) {
        formattedData.phoneNumber = {
          code: data.phoneCode || "",
          number: data.phoneNumber || "",
        };
      }

      // Format address
      if (data.country || data.state || data.city) {
        formattedData.address = {
          country: data.country || "",
          state: data.state || "",
          city: data.city || "",
        };
      }

      const response = await axios.post(`${USER_API}/signup`, formattedData);
      const responseData: { success: boolean; message: string } = response.data;
    
      if (responseData.success) {
        SuccessToast(responseData.message)
        setShowOTPComponent(true);
      } else {
        throw new Error(responseData.message);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast(error.response?.data?.message);
    }
    finally{
      setisDisabled(false);
    }
  };
  
  const handelGoogleBtn = () => {
    try {
      window.location.href = `${USER_API}/signup-google`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast("An error occurred Google OAuth" + error);
    }
  }
  const handelGithubBtn = () => {
    try {
      window.location.href = `${USER_API}/signup-github`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }catch (error: any) {
      ErrorToast("An error occurred Github OAuth" + error);
    }
  }
  
  return (
    <section className="w-full mx-auto px-5 flex justify-center items-center sm:py-0 py-10">
      {!showOTPComponent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative w-full mx-auto h-fit sm:py-10 mt-8 max-w-lg sm:p-8 p-4 flex flex-col justify-center items-center bg-white dark:bg-gray-800 rounded-3xl shadow-lg"
        >
          <h2 className="sm:text-4xl text-2xl font-bold mb-6 text-center">
            Sign Up for <span className="text-purple-500">Free</span>
          </h2>
          <form
            className="w-full flex flex-col space-y-3 font-sans relative"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="relative w-full flex flex-col sm:flex-row items-start justify-between gap-2 ">
              <div className=" w-full flex justify-center flex-col items-start">
                <input
                  type="text"
                  placeholder="First Name"
                  className={`p-3 border rounded-md w-full text-black dark:text-white  ${
                    errors.firstName ? "border-red-500" : ""
                  }`}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm text-end w-[90%]">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="w-full flex justify-center flex-col items-end">
                <input
                  type="text"
                  placeholder="Last Name"
                  className={`p-3 border rounded-md w-full text-black dark:text-white ${
                    errors.lastName ? "border-red-500" : ""
                  }`}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm text-end w-[90%]">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full flex justify-center flex-col items-start">
              <input
                type="text"
                placeholder="Username"
                className={`p-3 border rounded-md w-full text-black dark:text-white ${
                  errors.userName ? "border-red-500" : ""
                }`}
                {...register("userName")}
              />
              {errors.userName && (
                <p className="text-red-500 text-sm">{errors.userName.message}</p>
              )}
            </div>

            <div className="w-full flex justify-center flex-col items-start">
              <input
                type="email"
                placeholder="Email"
                className={`p-3 border rounded-md w-full  text-black dark:text-white ${
                  errors.email ? "border-red-500" : ""
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password field with visibility toggle */}
            <div className="relative w-full flex flex-col sm:flex-row items-start justify-between gap-2 ">
              <div className="relative w-full flex justify-end flex-col items-end">
                <div className="relative w-full">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Password"
                  className={`p-3 border rounded-md w-full text-black dark:text-white ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  {...register("password")}
                />
                <div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                {
                  theme === 'dark' ? (
                    passwordVisible ? <EyeOpenIcon fillColor="white" size={24} /> : <EyeCloseIcon fillColor="white"  size={24} /> 
                  ):(
                    passwordVisible ? <EyeOpenIcon fillColor="grey" size={24} /> : <EyeCloseIcon fillColor="grey" size={24} /> 
                  )
                }
                </div>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm text-end w-[90%]">
                    {errors.password.message}
                  </p>
                )}
                {(passwordValue.length > 0 || errors.password) && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1 w-[90%] text-end">
                    <p className={passwordValue.length >= 8 ? "text-green-500" : "text-red-500"}>
                      • At least 8 characters
                    </p>
                    <p className={/[a-z]/.test(passwordValue) ? "text-green-500" : "text-red-500"}>
                      • Lowercase letter
                    </p>
                    <p className={/[A-Z]/.test(passwordValue) ? "text-green-500" : "text-red-500"}>
                      • Uppercase letter
                    </p>
                    <p className={/\d/.test(passwordValue) ? "text-green-500" : "text-red-500"}>
                      • Number
                    </p>
                    <p className={/[@$!%*?&]/.test(passwordValue) ? "text-green-500" : "text-red-500"}>
                      • Special character (@$!%*?&)
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password field with visibility toggle */}
              <div className="relative w-full flex justify-end flex-col items-end">
                <div className="relative w-full">
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  placeholder="Confirm Password"
                  className={`p-3 border rounded-md w-full text-black dark:text-white ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  {...register("confirmPassword")}
                />
                <div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                >
                {
                  theme === 'dark' ? (
                    confirmPasswordVisible ? <EyeOpenIcon fillColor="white" size={24} /> : <EyeCloseIcon fillColor="white"  size={24} /> 
                  ):(
                    confirmPasswordVisible ? <EyeOpenIcon fillColor="grey" size={24} /> : <EyeCloseIcon fillColor="grey" size={24} /> 
                  )
                }
                </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm text-end w-[90%]">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Optional Additional Information Section */}
            <div className="w-full border-t border-gray-300 dark:border-gray-600 pt-4 mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">Additional Information (Optional)</p>
              
              {/* Date of Birth */}
              <div className="w-full flex justify-center flex-col items-start mb-3">
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  className={`p-3 border rounded-md w-full text-black dark:text-white ${
                    errors.userDob ? "border-red-500" : ""
                  }`}
                  {...register("userDob")}
                />
                {errors.userDob && (
                  <p className="text-red-500 text-sm">{errors.userDob.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="w-full flex flex-col sm:flex-row items-start justify-between gap-2 mb-3">
                <div className="w-full flex justify-center flex-col items-start">
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">Phone Code</label>
                  <input
                    type="text"
                    placeholder="+91"
                    className={`p-3 border rounded-md w-full text-black dark:text-white ${
                      errors.phoneCode ? "border-red-500" : ""
                    }`}
                    {...register("phoneCode")}
                  />
                  {errors.phoneCode && (
                    <p className="text-red-500 text-sm">{errors.phoneCode.message}</p>
                  )}
                </div>
                <div className="w-full flex justify-center flex-col items-start">
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="1234567890"
                    className={`p-3 border rounded-md w-full text-black dark:text-white ${
                      errors.phoneNumber ? "border-red-500" : ""
                    }`}
                    {...register("phoneNumber")}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="w-full flex flex-col sm:flex-row items-start justify-between gap-2 mb-3">
                <div className="w-full flex justify-center flex-col items-start">
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    className={`p-3 border rounded-md w-full text-black dark:text-white ${
                      errors.country ? "border-red-500" : ""
                    }`}
                    {...register("country")}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm">{errors.country.message}</p>
                  )}
                </div>
                <div className="w-full flex justify-center flex-col items-start">
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="State"
                    className={`p-3 border rounded-md w-full text-black dark:text-white ${
                      errors.state ? "border-red-500" : ""
                    }`}
                    {...register("state")}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="w-full flex justify-center flex-col items-start mb-3">
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  placeholder="City"
                  className={`p-3 border rounded-md w-full text-black dark:text-white ${
                    errors.city ? "border-red-500" : ""
                  }`}
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city.message}</p>
                )}
              </div>

              {/* Bio */}
              <div className="w-full flex justify-center flex-col items-start mb-3">
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">Bio (max 500 characters)</label>
                <textarea
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className={`p-3 border rounded-md w-full text-black dark:text-white resize-none ${
                    errors.bio ? "border-red-500" : ""
                  }`}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm">{errors.bio.message}</p>
                )}
              </div>

              {/* Learning Goals */}
              <div className="w-full flex flex-col sm:flex-row items-start justify-between gap-2 mb-3">
                <div className="w-full flex justify-center flex-col items-start">
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">Learning Goal</label>
                  <select
                    className={`p-3 border rounded-md w-full text-black dark:text-white bg-white dark:bg-gray-700 ${
                      errors.learningGoal ? "border-red-500" : ""
                    }`}
                    {...register("learningGoal")}
                  >
                    <option value="">Select your goal</option>
                    <option value="get a job">Get a Job</option>
                    <option value="upskill">Upskill</option>
                    <option value="academic">Academic</option>
                    <option value="hobby">Hobby</option>
                  </select>
                  {errors.learningGoal && (
                    <p className="text-red-500 text-sm">{errors.learningGoal.message}</p>
                  )}
                </div>
                <div className="w-full flex justify-center flex-col items-start">
                  <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">Experience Level</label>
                  <select
                    className={`p-3 border rounded-md w-full text-black dark:text-white bg-white dark:bg-gray-700 ${
                      errors.experienceLevel ? "border-red-500" : ""
                    }`}
                    {...register("experienceLevel")}
                  >
                    <option value="">Select your level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  {errors.experienceLevel && (
                    <p className="text-red-500 text-sm">{errors.experienceLevel.message}</p>
                  )}
                </div>
              </div>
            </div>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              className="py-3 px-6 bg-purple-500 text-white rounded-lg shadow-md"
              disabled={isDisabled}
            >
              Sign Up
            </motion.button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-300 mt-3">
              Already have an account?{' '}
              <button
                type="button"
                className="text-purple-500 hover:underline"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            </p>

            <div className="flex items-center justify-center my-4">
              <div className="h-px bg-gray-300 w-full"></div>
              <span className="px-3 text-sm text-gray-500">OR</span>
              <div className="h-px bg-gray-300 w-full"></div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              className="py-3 px-6 bg-[#e7f3ff] dark:bg-slate-700 text-black  hover:shadow-sm hover:shadow-purple-700 dark:hover:shadow-purple-600 transition-all dark:text-white rounded-lg flex items-center justify-center"
              onClick={handelGoogleBtn}
            >
              <GoogleIcon size={24} /> <span className="ml-4">Sign Up with Google</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              className="py-3 px-6 bg-gray-800/20 dark:bg-slate-700 text-black dark:text-white hover:shadow-sm hover:shadow-purple-700 dark:hover:shadow-purple-600 transition-all rounded-lg flex items-center justify-center"
              onClick={handelGithubBtn}
            >
              <GitHubIcon size={24} /> <span className="ml-4">Sign Up with GitHub</span>
            </motion.button>
          </form>
          <motion.button
            whileHover={{scale : 1.2}}
            className="absolute top-4 right-4 cursor-pointer"
            onClick={closeSignup}
          >
            <CrossIcon size={30} fillColor="red" />
          </motion.button>
        </motion.div>
      ) : (
        <SignUpOTPModal userEmail={formData.email}/>
      )}
    </section>
  );
};

export default SignupModal;
