export const USER_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_USER_API;
export const COURSE_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_COURSE_API;
export const VIDEO_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_VIDEO_API;
export const TEST_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_TEST_API;
export const NEWS_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_NEWS_API || "http://localhost:8080/api/v1/news";
export const REWARDS_API = import.meta.env.VITE_PUBLIC_COURSE_AKSAR_REWARDS_API || (USER_API && USER_API.replace("/user", "/rewards")) || "http://localhost:8080/api/v1/rewards";

