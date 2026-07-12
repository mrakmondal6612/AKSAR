import React, { lazy, Suspense, useState, useEffect } from "react";
import HeroLeftSection from "@/components/homepage/HeroLeftSection";
import HeroRightSection from "@/components/homepage/HeroRightSection";
const CommunityStatistics = lazy(() => import("@/components/homepage/CommunityStatistics"));
const PremiumCardsSection = lazy(() => import("@/components/homepage/PremiumCardsSection"));
const WhyAksarCarousel = lazy(() => import("@/components/homepage/WhyAksarCarousel"));
const AksarPresentsSection = lazy(() => import("@/components/homepage/AksarPresentsSection"));
import SignupModal from "@/components/modals/SignupModal";
import LoginModal from "@/components/modals/LoginModal";
import ResetPasswordModal from "@/components/modals/ResetPasswordModal";
import SignUpOTPModal from "@/components/modals/SignUpOTPModal";
import { Accordion, AccordionItem } from "@nextui-org/react";
import { faqData } from "@/constants/index";
import { Star } from "lucide-react";
import axios from "axios";
import { USER_API } from "@/lib/env";
import { SuccessToast, ErrorToast } from "@/lib/toasts";
import { useAuthContext } from "@/context/authContext";
import { getVerifiedToken } from "@/lib/cookieService";
import { useNavigate } from "react-router-dom";

interface heroSectionProps{
  route: string,
  propEmail?: string
}

const HeroSection: React.FC<heroSectionProps> = ({route , propEmail}) => {
  const { userData, isLoggedIn } = useAuthContext();
  const navigate = useNavigate();

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  // Feedback form states
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (route === "homepage") {
      const fetchTestimonials = async () => {
        try {
          const res = await axios.get(`${USER_API}/feedback`);
          if (res.data && res.data.success && res.data.data.length > 0) {
            setTestimonials(res.data.data);
          }
        } catch (error) {
          console.error("Error fetching testimonials:", error);
        } finally {
          setLoadingTestimonials(false);
        }
      };
      fetchTestimonials();
    }
  }, [route]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      ErrorToast("Please log in to leave feedback.");
      return;
    }

    if (!feedbackMessage.trim()) {
      ErrorToast("Please write a message.");
      return;
    }

    try {
      setSubmittingFeedback(true);
      const token = getVerifiedToken();
      const headers = { Authorization: token ? `Bearer ${token}` : "" };

      const res = await axios.post(
        `${USER_API}/feedback`,
        {
          rating: feedbackRating,
          message: feedbackMessage,
        },
        { headers }
      );

      if (res.data && res.data.success) {
        SuccessToast("Thank you for your feedback!");
        
        // Append newly submitted feedback to dynamic testimonials stream
        const newFeedbackItem = res.data.data;
        setTestimonials((prev) => [newFeedbackItem, ...prev]);

        // Reset form
        setFeedbackRating(5);
        setFeedbackMessage("");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      ErrorToast("Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getModalComponent = () => {
    switch (route) {
      case "login":
        return <LoginModal />;
      case "signup":
        return <SignupModal />;
      case "reset-password":
        return <ResetPasswordModal />;
      case "verify-email":
        return (propEmail && 
        <section className="w-full mx-auto px-5 flex justify-center items-center sm:py-0 py-10">
          < SignUpOTPModal userEmail={propEmail} />
        </section>
      );
      case "homepage":
        return <HeroLeftSection />;
    }
  };

  return (
    <>
      <section className="max-w-7xl mx-auto flex flex-col md:flex-row sm:pt-40 pt-28 xl:pt-24 lg:pt-36 gap-5 relative px-4 sm:px-6">
        {getModalComponent()}
        <HeroRightSection />
      </section>
      {route === "homepage" && (
        <Suspense fallback={<div className="h-20" />}>
          <CommunityStatistics />
          <PremiumCardsSection />
          <WhyAksarCarousel />
          <AksarPresentsSection />

          {/* Learner Testimonials Section */}
          <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 border-t border-gray-100 dark:border-gray-900">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-[0.24em] text-teal-600 dark:text-teal-400 font-semibold mb-2">
                Reviews
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold font-ubuntu text-slate-950 dark:text-white mb-3">
                Loved by Students Globally
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-sans">
                See how AKSAR helps learners master coding skills, pass certifications, and build successful tech careers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loadingTestimonials ? (
                <div className="col-span-1 md:col-span-3 text-center py-6 text-slate-500 dark:text-slate-400 font-medium">
                  Loading dynamic reviews...
                </div>
              ) : (
                (testimonials.length > 0 ? testimonials : [
                  {
                    name: "Arnab Mandal",
                    role: "Full Stack Student",
                    message: "The curated YouTube courses on AKSAR are incredibly organized. I saved weeks of random searching!",
                    rating: 5
                  },
                  {
                    name: "Kumar Kuntal Kundu",
                    role: "Career Switcher",
                    message: "The Mock Tests and AI Recommendations helped me prepare for interviews with high confidence. Highly recommend AKSAR!",
                    rating: 5
                  },
                  {
                    name: "Ajay Mondal",
                    role: "College Student",
                    message: "Excellent community. Whenever I got stuck on a React project, the AKSAR study circle helped me resolve it within hours.",
                    rating: 5
                  }
                ]).slice(0, 6).map((t, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-gray-50/50 dark:bg-neutral-900/40 border border-gray-200 dark:border-gray-800/80 shadow-md flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex gap-1">
                        {[...Array(t.rating || 5)].map((_, sIdx) => (
                          <Star key={sIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans italic">
                        "{t.message}"
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-200/50 dark:border-gray-800/50">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500/20 bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-ubuntu font-bold shrink-0 text-sm">
                        {t.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <h4 className="font-ubuntu font-bold text-sm text-slate-900 dark:text-white">
                          {t.name || "Anonymous"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t.role || "Verified Student"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Home FAQ Accordion Section */}
          <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 border-t border-gray-100 dark:border-gray-900">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-[0.24em] text-purple-600 dark:text-purple-400 font-semibold mb-2">
                Questions
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold font-ubuntu text-slate-950 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-2">
              {faqData.slice(0, 5).map((faq, idx) => (
                <Accordion key={idx} isCompact className="bg-gray-50/50 dark:bg-neutral-900/40 rounded-xl border border-gray-200/20 dark:border-gray-800/30">
                  <AccordionItem
                    aria-label={`FAQ ${idx + 1}`}
                    title={faq.question}
                    className="text-sm sm:text-base font-ubuntu text-slate-800 dark:text-white font-semibold"
                  >
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans pb-3">
                      {faq.answer}
                    </p>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </section>

          {/* User Feedback Input Section */}
          <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 border-t border-gray-100 dark:border-gray-900">
            <div className="text-center mb-8">
              <p className="text-sm uppercase tracking-[0.24em] text-teal-650 dark:text-teal-400 font-semibold mb-2">
                Feedback
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold font-ubuntu text-slate-950 dark:text-white">
                Share Your Experience
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-sans mt-2">
                We value your input! Let us know how AKSAR has helped your learning path, or how we can improve.
              </p>
            </div>

            {isLoggedIn ? (
              <form onSubmit={handleSubmitFeedback} className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-gray-200/20 dark:border-neutral-800/60 shadow-xl space-y-5">
                <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/40 rounded-2xl flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-ubuntu font-bold shrink-0 text-sm">
                      {userData.avatarFallbackText || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Posting review as</p>
                      <p className="text-sm font-bold text-gray-950 dark:text-white">
                        {userData.firstName} {userData.lastName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 select-none">
                    {userData.email}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 font-sans">
                    Rating
                  </label>
                  <div className="flex gap-1.5 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="focus:outline-none transform active:scale-90 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors duration-150 ${
                            star <= feedbackRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300 dark:text-gray-650 hover:text-amber-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2 font-ubuntu">
                      ({feedbackRating} / 5)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 font-sans">
                    Your Message *
                  </label>
                  <textarea
                    placeholder="Tell us what you think about AKSAR..."
                    rows={4}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-950 dark:text-white resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-650 hover:to-blue-750 text-white font-ubuntu font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-500/10"
                >
                  {submittingFeedback ? "Submitting Feedback..." : "Submit Feedback"}
                </button>
              </form>
            ) : (
              <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md p-8 rounded-3xl border border-gray-200/20 dark:border-neutral-800/60 shadow-xl text-center space-y-4">
                <p className="text-sm font-semibold text-neutral-650 dark:text-neutral-455 max-w-sm mx-auto font-sans leading-relaxed">
                  Have you been studying with AKSAR? Log in to your account to share your feedback and experience directly!
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:scale-[1.02] active:scale-95 text-white font-ubuntu font-bold rounded-xl transition-all duration-200 shadow-md shadow-teal-500/10"
                >
                  Log In to Leave Feedback
                </button>
              </div>
            )}
          </section>
        </Suspense>
      )}
    </>
  );
};

export default React.memo(HeroSection);
