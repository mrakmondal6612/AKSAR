import React, { useState } from 'react';
import { z, ZodType } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { motion } from 'framer-motion';
import axios from "axios";
import { USER_API } from "@/lib/env";
import { SuccessToast, ErrorToast } from "@/lib/toasts";

interface User_Mail {
  email: string;
  message: string;
}

const schema: ZodType<User_Mail> = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Invalid email format'
    ),
  message: z.string().min(1, 'Message is required').max(3500, 'Message is too long'),
});

const ContactUs: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<User_Mail>({
    mode: 'all',
    resolver: zodResolver(schema),
  });

  const submit: SubmitHandler<User_Mail> = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${USER_API}/contact`, {
        email: data.email,
        message: data.message,
      });
      if (res.data?.success) {
        SuccessToast(res.data.message || "Your message has been sent successfully!");
        setIsSuccess(true);
        reset();
      } else {
        ErrorToast(res.data.message || "Failed to send message.");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen h-auto bg-gray-100 dark:bg-gray-900 relative overflow-x-hidden px-6 py-12 lg:pt-56 pt-60 md:pt-56">
      <BackgroundBeams className="absolute top-0 left-0 w-full h-full" />

      <div className="max-w-6xl mx-auto p-4 relative space-y-8">
        {/* Animated Heading */}
        <div className="text-center space-y-4">
          <motion.h1
            className="text-5xl md:text-6xl font-sans font-bold text-neutral-800 dark:text-white"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            Contact Us
          </motion.h1>
          <motion.p
            className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto text-sm sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            We're here to help with any questions about our courses, programs, or events. Whether you're looking to enhance your skills or need more information about our offerings, we're just a message away.
          </motion.p>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
          {/* Left Column - Form Submission */}
          <div className="lg:col-span-7 bg-white/40 dark:bg-neutral-800/20 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-gray-200/20 dark:border-neutral-700/30 shadow-xl">
            {isSuccess ? (
              <motion.div
                className="text-center space-y-6 py-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400 text-3xl font-bold">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-white">
                  Thank You!
                </h2>
                <p className="text-neutral-755 dark:text-neutral-300 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
                  Your message has been received. Our team will review your inquiry and get back to you within 24 to 48 hours.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium transition-colors duration-200"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <p className="bg-clip-text text-transparent bg-gradient-to-b from-teal-500 to-teal-200 md:text-lg text-base text-start font-semibold">
                  Feel free to share your thoughts and suggestions!
                </p>

                {/* Form */}
                <motion.form
                  onSubmit={handleSubmit(submit)}
                  className="space-y-5 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="relative">
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="Your email address"
                      disabled={isSubmitting}
                      className="w-full p-4 rounded-lg border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-teal-500 bg-neutral-100 dark:bg-neutral-800 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 disabled:opacity-50 text-gray-900 dark:text-white"
                    />
                    {errors.email && (
                      <p className="text-red-550 text-xs absolute -bottom-5 right-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      {...register('message')}
                      placeholder="Your message"
                      rows={5}
                      disabled={isSubmitting}
                      className="w-full p-4 rounded-lg border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-teal-500 bg-neutral-100 dark:bg-neutral-800 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 disabled:opacity-50 text-gray-900 dark:text-white"
                    />
                    {errors.message && (
                      <p className="text-red-505 text-xs absolute -bottom-5 right-1">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                  >
                    {isSubmitting ? "Sending Message..." : "Send Message"}
                  </button>
                </motion.form>
              </div>
            )}
          </div>

          {/* Right Column - Contact Info & Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Contact Card */}
            <motion.div
              className="bg-white/40 dark:bg-neutral-800/20 backdrop-blur-md p-6 rounded-3xl border border-gray-200/20 dark:border-neutral-700/30 shadow-xl space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-neutral-800 dark:text-white font-ubuntu">
                Contact Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-650 dark:text-teal-400 shrink-0 text-sm">
                    ✉
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Support Email</p>
                    <a href="mailto:mr.aktv2529@gmail.com" className="text-sm font-medium hover:underline text-neutral-800 dark:text-white">
                      mr.aktv2529@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-650 dark:text-teal-400 shrink-0 text-sm">
                    ☎
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Phone Hotline</p>
                    <a href="tel:+919547558322" className="text-sm font-medium hover:underline text-neutral-800 dark:text-white">
                      +91 95475 58322
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-650 dark:text-teal-400 shrink-0 text-sm">
                    📍
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Address</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-white">
                      Hoogly, West Bengal, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-655 dark:text-teal-400 shrink-0 text-sm">
                    ⏰
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Support Hours</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-white">
                      Monday - Friday: 9:00 AM - 6:00 PM IST
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Inquiries / Assistance Accordion */}
            <motion.div
              className="bg-white/40 dark:bg-neutral-800/20 backdrop-blur-md p-6 rounded-3xl border border-gray-200/20 dark:border-neutral-700/30 shadow-xl space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-neutral-800 dark:text-white font-ubuntu">
                How Can We Assist?
              </h3>
              <ul className="space-y-3">
                {[
                  { title: 'Course Inquiries:', text: 'Need help with our YouTube courses?' },
                  { title: 'Program Information:', text: "Learn more about our skill-enhancing programs." },
                  { title: 'Event Details:', text: "Stay updated on upcoming events and how to join." },
                  { title: 'Technical Support:', text: "Facing issues accessing content? We’re here to help." }
                ].map((item, index) => (
                  <li key={index} className="flex flex-col gap-0.5 border-b border-gray-200/20 dark:border-neutral-800 pb-2 last:border-b-0">
                    <span className="font-semibold text-xs text-teal-600 dark:text-teal-400">
                      {item.title}
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-350">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ContactUs;
