import axios from "axios";
import { getVerifiedToken } from "./cookieService";
import { ErrorToast, SuccessToast } from "./toasts";

const TEST_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_TEST_API || "http://localhost:8080/api/v1/test";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${getVerifiedToken()}`,
});

// Test Management
export const createTest = async (testData: any) => {
  try {
    const response = await axios.post(`${TEST_API}/create`, testData, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      SuccessToast("Test created successfully");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to create test");
    throw error;
  }
};

export const updateTest = async (testId: string, testData: any) => {
  try {
    const response = await axios.put(`${TEST_API}/update/${testId}`, testData, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      SuccessToast("Test updated successfully");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to update test");
    throw error;
  }
};

export const publishTest = async (testId: string) => {
  try {
    const response = await axios.patch(`${TEST_API}/publish/${testId}`, {}, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      SuccessToast("Test published successfully");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to publish test");
    throw error;
  }
};

export const deleteTest = async (testId: string) => {
  try {
    const response = await axios.delete(`${TEST_API}/delete/${testId}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      SuccessToast("Test deleted successfully");
      return response.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to delete test");
    throw error;
  }
};

// Test Retrieval
export const getTestById = async (testId: string) => {
  try {
    const response = await axios.get(`${TEST_API}/get/${testId}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch test");
    throw error;
  }
};

export const getTestsByCourse = async (courseId: string) => {
  try {
    const response = await axios.get(`${TEST_API}/course/${courseId}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch tests");
    throw error;
  }
};

export const getAllTests = async (params?: any) => {
  try {
    const response = await axios.get(`${TEST_API}/all`, {
      headers: getAuthHeaders(),
      params,
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch tests");
    throw error;
  }
};

export const getTestsByInstructor = async () => {
  try {
    const response = await axios.get(`${TEST_API}/instructor`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch tests");
    throw error;
  }
};

export const getTestForAttempt = async (testId: string) => {
  try {
    const response = await axios.get(`${TEST_API}/attempt/${testId}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch test");
    throw error;
  }
};

// Test Attempts
export const startTestAttempt = async (testId: string, ipAddress?: string, browserInfo?: string) => {
  try {
    const response = await axios.post(
      `${TEST_API}/attempt/start/${testId}`,
      { ipAddress, browserInfo },
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to start test");
    throw error;
  }
};

export const submitTestAttempt = async (attemptId: string, answers: any[]) => {
  try {
    const response = await axios.post(
      `${TEST_API}/attempt/submit/${attemptId}`,
      { answers },
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      SuccessToast("Test submitted successfully");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to submit test");
    throw error;
  }
};

export const getTestAttempt = async (attemptId: string) => {
  try {
    const response = await axios.get(`${TEST_API}/attempt/${attemptId}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch attempt");
    throw error;
  }
};

export const getUserAttempts = async (testId?: string) => {
  try {
    const response = await axios.get(`${TEST_API}/attempts/user`, {
      headers: getAuthHeaders(),
      params: testId ? { testId } : {},
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch attempts");
    throw error;
  }
};

// Marksheet & Certificate
export const getUserMarksheets = async (courseId?: string) => {
  try {
    const response = await axios.get(`${TEST_API}/marksheet/user`, {
      headers: getAuthHeaders(),
      params: courseId ? { courseId } : {},
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch marksheets");
    throw error;
  }
};

export const getMarksheetById = async (marksheetId: string) => {
  try {
    const response = await axios.get(`${TEST_API}/marksheet/${marksheetId}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch marksheet");
    throw error;
  }
};

export const downloadCertificate = async (marksheetId: string) => {
  try {
    const response = await axios.post(
      `${TEST_API}/certificate/download/${marksheetId}`,
      {},
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      SuccessToast("Certificate download initiated");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to download certificate");
    throw error;
  }
};

// Gamification
export const getLeaderboard = async (testId?: string, courseId?: string, limit?: number) => {
  try {
    const response = await axios.get(`${TEST_API}/leaderboard`, {
      headers: getAuthHeaders(),
      params: { testId, courseId, limit },
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch leaderboard");
    throw error;
  }
};

export const getUserStats = async () => {
  try {
    const response = await axios.get(`${TEST_API}/stats/user`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch stats");
    throw error;
  }
};

// Auto-assignment
export const autoAssignTest = async (courseId: string, userId: string) => {
  try {
    const response = await axios.post(
      `${TEST_API}/auto-assign`,
      { courseId, userId },
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      SuccessToast("Test assigned successfully");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to assign test");
    throw error;
  }
};

export const checkCourseCompletion = async (courseId: string, userId: string) => {
  try {
    const response = await axios.get(
      `${TEST_API}/check-completion/${courseId}/${userId}`,
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to check completion");
    throw error;
  }
};

export const completeCourseAndAssignTest = async (courseId: string) => {
  try {
    const response = await axios.post(
      `${TEST_API}/complete-and-assign/${courseId}`,
      {},
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      SuccessToast("Course completed and test assigned");
      return response.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to complete course");
    throw error;
  }
};

// Admin Functions
export const getAllTestStats = async () => {
  try {
    const response = await axios.get(`${TEST_API}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch stats");
    throw error;
  }
};

export const manageTestStatus = async (testId: string, status: string) => {
  try {
    const response = await axios.patch(
      `${TEST_API}/admin/status/${testId}`,
      { status },
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      SuccessToast("Test status updated");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to update status");
    throw error;
  }
};

export const bulkDeleteTests = async (testIds: string[]) => {
  try {
    const response = await axios.delete(`${TEST_API}/admin/bulk`, {
      headers: getAuthHeaders(),
      data: { testIds },
    });
    if (response.data.success) {
      SuccessToast("Tests deleted successfully");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to delete tests");
    throw error;
  }
};

export const getAllMarksheetsAdmin = async (params?: any) => {
  try {
    const response = await axios.get(`${TEST_API}/admin/marksheets`, {
      headers: getAuthHeaders(),
      params,
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch marksheets");
    throw error;
  }
};

export const revokeCertificate = async (marksheetId: string) => {
  try {
    const response = await axios.patch(
      `${TEST_API}/admin/revoke/${marksheetId}`,
      {},
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      SuccessToast("Certificate revoked");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to revoke certificate");
    throw error;
  }
};

export const updateGamificationSettings = async (settings: any) => {
  try {
    const response = await axios.put(
      `${TEST_API}/admin/gamification`,
      settings,
      { headers: getAuthHeaders() }
    );
    if (response.data.success) {
      SuccessToast("Settings updated");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to update settings");
    throw error;
  }
};

export const getUserTestHistoryAdmin = async (userId: string) => {
  try {
    const response = await axios.get(`${TEST_API}/admin/user-history/${userId}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch user history");
    throw error;
  }
};

// Public Certificate Verification
export const verifyCertificatePublic = async (certificateId: string) => {
  try {
    const response = await axios.post(`${TEST_API}/verify/public`, {
      certificateId,
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    throw error;
  }
};

// Get all active courses for dropdown
export const getAllActiveCourses = async () => {
  try {
    const COURSE_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_COURSE_API || "http://localhost:8080/api/v1/course";
    const response = await axios.get(`${COURSE_API}/get-all-courses`);
    if (response.data.success) {
      // Return all courses without filtering by isVerified
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch courses");
    throw error;
  }
};

// Get course details by ID
export const getCourseById = async (courseId: string) => {
  try {
    const COURSE_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_COURSE_API || "http://localhost:8080/api/v1/course";
    const response = await axios.post(`${COURSE_API}/get-course`, { courseId });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to fetch course details");
    throw error;
  }
};

// AI Test Generation Functions
export const generateTestWithAI = async (testData: any) => {
  try {
    const response = await axios.post(`${TEST_API}/ai/generate`, testData, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      SuccessToast("Test generated successfully with AI");
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to generate test with AI");
    throw error;
  }
};

export const evaluateSAQWithAI = async (evaluationData: any) => {
  try {
    const response = await axios.post(`${TEST_API}/ai/evaluate-saq`, evaluationData, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    console.error("AI evaluation error:", error);
    throw error;
  }
};

export const generateQuestionsWithAI = async (questionData: any) => {
  try {
    const response = await axios.post(`${TEST_API}/ai/generate-questions`, questionData, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  } catch (error: any) {
    ErrorToast(error.response?.data?.message || "Failed to generate questions with AI");
    throw error;
  }
};
