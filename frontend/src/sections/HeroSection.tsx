import React, { lazy, Suspense } from "react";
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

interface heroSectionProps{
  route: string,
  propEmail?: string
}

const HeroSection: React.FC<heroSectionProps> = ({route , propEmail}) => {

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
      <section className="max-w-7xl mx-auto flex-row flex sm:pt-40 pt-28 xl:pt-24 lg:pt-36 gap-5 relative">
        {getModalComponent()}
        <HeroRightSection />
      </section>
      {route === "homepage" && (
        <Suspense fallback={<div className="h-20" />}>
          <CommunityStatistics />
          <PremiumCardsSection />
          <WhyAksarCarousel />
          <AksarPresentsSection />
        </Suspense>
      )}
    </>
  );
};

export default React.memo(HeroSection);
