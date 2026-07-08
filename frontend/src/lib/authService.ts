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

  // Force cache clear for onboarding field update
  // Check if cached data has the new onboardingCompleted field
  const cachedData = localStorage.getItem('cachedUserData');
  
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      // Clear cache if it doesn't have onboardingCompleted field (data structure changed)
      if (parsed.onboardingCompleted === undefined) {
        console.log("Clearing old cache without onboardingCompleted field");
        localStorage.removeItem('cachedUserData');
        localStorage.removeItem('userDataCacheTime');
      }
    } catch (e) {
      // Clear corrupted cache
      console.log("Clearing corrupted cache");
      localStorage.removeItem('cachedUserData');
      localStorage.removeItem('userDataCacheTime');
    }
  }
  
  // Re-check after potential cache clear
  const cachedDataAfter = localStorage.getItem('cachedUserData');
  const cacheTimeAfter = localStorage.getItem('userDataCacheTime');
  
  if (cachedDataAfter && cacheTimeAfter) {
    const cacheAge = Date.now() - parseInt(cacheTimeAfter);
    // Use cached data if less than 5 minutes old
    if (cacheAge < 5 * 60 * 1000) {
      return JSON.parse(cachedDataAfter) as UserDataProps;
    }
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
        bookmarks : responseData.bookmarks,
        progress : responseData.progress,
        history : responseData.history,
        interests: responseData.interests,
        interestTags: responseData.interestTags,
        learningGoal: responseData.learningGoal,
        experienceLevel: responseData.experienceLevel,
        onboardingCompleted: responseData.onboardingCompleted || false,
      };

      // Cache the data
      localStorage.setItem('cachedUserData', JSON.stringify(userData));
      localStorage.setItem('userDataCacheTime', Date.now().toString());

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
