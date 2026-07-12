import React, { useState } from "react";
import { motion } from "framer-motion";
import CrossIcon from "@/Icons/CrossIcon";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import ResetOTPModal from "./ResetOTPModal";
import { USER_API } from "@/lib/env";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ResetPasswordSchema = z.object({
    email: z
      .string()
      .email({ message: "Invalid email format" })
      .regex(emailRegex, { message: "Please provide a valid email" }),
})

type ResetPasswordSchemaData = z.infer<typeof ResetPasswordSchema>;

const ResetPasswordModal: React.FC = () => {
  const navigate = useNavigate();
  const [showOTPComponent, setShowOTPComponent] = useState(false);
  const [isDisabled , setisDisabled] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  
  const closeResetPassword = () => {
    setShowOTPComponent(false);
    setUserEmail("");
    navigate("/");
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchemaData>({
    resolver: zodResolver(ResetPasswordSchema),
  });
  
  const onSubmit = async (data: ResetPasswordSchemaData) => {
    setisDisabled(true);
    try {
      const response = await axios.post(`${USER_API}/reset-password`, data);

      const responseData: { success: boolean; message: string} = response.data;
      
      if (responseData.success) {   
        setUserEmail(data.email);
        SuccessToast(responseData.message )
        setShowOTPComponent(true);
      } else {
        throw new Error(responseData.message);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error : any) {
      ErrorToast(error.response?.data?.message);
    }
    finally{
      setisDisabled(false);
    }
  };
  
  const handleAlreadyHaveAnOTP = () => {
    navigate("/reset-password")
    setShowOTPComponent(true);
  }

  
  return (
    <section className="w-full mx-auto px-5 flex justify-center items-center h-screen">
        {!showOTPComponent ? 
        (<motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative w-full mx-auto h-fit sm:py-10 mt-8 max-w-lg sm:p-8 p-4 flex flex-col justify-center items-center bg-white dark:bg-gray-800 rounded-3xl shadow-lg "
        >
          <h2 className="sm:text-4xl text-2xl font-bold mb-6 text-center">
            Enter your<span className="text-purple-500">{" "}Email</span>
          </h2>
          <form
            className="w-full flex flex-col space-y-3 font-sans relative"
            onSubmit={handleSubmit(onSubmit)}
          > 
            <div className="w-full flex justify-center flex-col items-start ">
                <input
                type="text"
                placeholder="email required"
                className={`p-3 border rounded-md w-full text-black dark:text-white ${
                    errors.email ? "border-red-500" : ""
                }`}
                {...register("email")}
                />
                {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
            </div>
            <span onClick={handleAlreadyHaveAnOTP} className="flex justify-end cursor-pointer">
              <span className="font-ubuntu hover:text-blue-500 dark:text-white/80 text-black/80">Already have an OTP?{" "}</span>
            </span>
            <motion.button
              whileTap={isDisabled ? {} : { scale: 0.95 }}
              type="submit"
              disabled={isDisabled}
              className={`py-3 px-6 bg-purple-500 text-white rounded-lg shadow-md flex items-center justify-center gap-2 ${
                isDisabled ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isDisabled ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </motion.button>
          </form>

          <motion.button
            whileHover={{ scale: 1.2 }}
            onClick={closeResetPassword}
            className="mt-4 text-blue-600 underline flex items-center absolute top-2 right-4"
            disabled={isDisabled}
          >
            <CrossIcon fillColor="red" size={24} />
          </motion.button>
        </motion.div>):
        <ResetOTPModal userEmail={userEmail} />
        }
    </section>
  );
};

export default ResetPasswordModal;
