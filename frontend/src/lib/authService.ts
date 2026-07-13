import axios from "axios";
import { getVerifiedToken } from "@/lib/cookieService";
import { ErrorToast } from "@/lib/toasts";
import { USER_API } from "@/lib/env";
import { UserDataProps } from "@/context/authContext";


export const getUserData = async (): Promise<UserDataProps | null> => {
  const jwt = getVerifiedToken();
  if (!jwt) {
    return null;
  }

  try {
    const response = await axios.get(`${USER_API}/get-user`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (response?.data?.success && response.data.data) {
      const responseData = response.data.data;

      const userData: UserDataProps = {
        firstName: responseData.firstName || "Unknown",
        lastName: responseData.lastName || "User",
        fullName: (responseData.firstName?.trim() + " " + responseData.lastName?.trim()) || "Unknown User",
        email: responseData.email || "unknown@gmail.com",
        userName: responseData.userName || "unknown_user",
        profileImageUrl: responseData.profileImageUrl || "",
        emailVerificationStatus: responseData.emailVerificationStatus || false,
        phoneNumber: {
          code: responseData.phoneNumber?.code || "",
          number: responseData.phoneNumber?.number || "",
        },
        address: responseData.address?.country
            ? `${responseData.address.city}, ${responseData.address.state}, ${responseData.address.country}`
            : "",
        phoneNumberVerificationStatus: responseData.phoneNumberVerificationStatus || false,
        bio: responseData.bio || "",
        role: responseData.role || "STUDENT",
        userDob: responseData.userDob || "",
        avatarFallbackText: `${responseData.firstName?.[0]?.toUpperCase() || "U"}${responseData.lastName?.[0]?.toUpperCase() || "G"}`,
        id: responseData.uniqueId,
        enrolledIn: responseData.enrolledIn,
        bookmarks: responseData.bookmarks,
        progress: responseData.progress,
        history: responseData.history,
        interests: responseData.interests,
        interestTags: responseData.interestTags,
        learningGoal: responseData.learningGoal,
        experienceLevel: responseData.experienceLevel,
        onboardingCompleted: responseData.onboardingCompleted || false,
        points: responseData.points || 0,
        bonusPoints: responseData.bonusPoints || 0,
        lifetimePoints: responseData.lifetimePoints || 0,
        currentStreak: responseData.currentStreak || 0,
        lastActivityDate: responseData.lastActivityDate || "",
        badges: responseData.badges || [],
        unlockedUpgrades: responseData.unlockedUpgrades || [],
        premiumExpiry: responseData.premiumExpiry || "",
        referredBy: responseData.referredBy || "",
        referralCode: responseData.referralCode || "",
      };

      return userData;
    } else {
      ErrorToast("User Data not found");
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Something went wrong");
    return null;
  }
};