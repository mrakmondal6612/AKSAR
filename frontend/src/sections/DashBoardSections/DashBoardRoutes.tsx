import { lazy, Suspense, useMemo } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useAuthContext } from "@/context/authContext";
import { DashboardContextProvider } from "@/context/dashboardContext";
const DashBoard = lazy(() => import("@/sections/DashBoardSections/DashBoard"));
const Bookmarks = lazy(() => import("@/sections/DashBoardSections/Bookmarks"));
const Courses = lazy(() => import("@/sections/DashBoardSections/Courses"));
const RefreshPage = lazy(() => import("@/sections/DashBoardSections/RefreshPage"));
const AddCourses = lazy(() => import("@/sections/DashBoardSections/AddCourses"));
const AddTests = lazy(() => import("@/sections/DashBoardSections/AddTests"));
const AddVideos = lazy(() => import("@/sections/DashBoardSections/AddVideos"));
const ProductionTodoList = lazy(() => import("@/sections/DashBoardSections/ProductionTodoList"));
const ViewCourse = lazy(() => import("@/sections/DashBoardSections/ViewCourse"));
const VideoPlaySection = lazy(() => import("./VideoPlaySection"));
const VideoEditPage = lazy(() => import("@/components/addVideos/VideoEditPage"));
const UnderMaintenancePage = lazy(() => import("@/components/UnderMaintenancePage"));
const PageNotFound = lazy(() => import("@/components/PageNotFound"));
const UnauthorizedPage = lazy(() => import("@/components/UnauthorizedPage"));
import DashBoardNavbar from "./DashBoardNavbar";
const CourseTimelinePage = lazy(() => import("@/sections/DashBoardSections/CourseTimelinePage"));
const PageTransitionSwipeAnimation = lazy(() => import("@/Effects/PageTransitionSwipeAnimation"));
const Subscription = lazy(() => import("./Subscription"));
const History = lazy(() => import("./History"));

const CoursesManagement = lazy(() => import("@/sections/DashBoardSections/CoursesManagement"));

const DashboardRoutes: React.FC = () => {
  const { userData } = useAuthContext();
  const location = useLocation();

  const routes = useMemo(() => {
    const commonRoutes = [
      { path: "/dashboard", element: <DashBoard /> },
      { path: "/bookmarks", element: <Bookmarks /> },
      { path: "/courses", element: <Courses /> },
      { path: "/course-timeline", element: <CourseTimelinePage /> },
      { path: "/subscription", element: <Subscription/> },
      { path: "/todo-list", element: <ProductionTodoList /> },
      { path: "/history", element: <History/> },
      { path: "/refresh", element: <RefreshPage /> },
      { path: "/view-course", element: <ViewCourse /> },
      { path: "/video-player", element: <VideoPlaySection /> },
      { path: "/test", element: <UnderMaintenancePage pageName="Test" /> },
    ];

    if (userData.role === "ADMIN" || userData.role === "MASTER") {
      return [
        ...commonRoutes,
        { path: "/add-courses", element: <AddCourses /> },
        { path: "/add-tests", element: <AddTests /> },
        { path: "/add-videos", element: <AddVideos /> },
        { path: "/edit-video", element: <VideoEditPage /> },
        { path: "/admin/courses-management", element: <CoursesManagement /> },
        { path: "/admin/student-management", element: <UnderMaintenancePage pageName="Student Management" /> },
        { path: "/admin/tests", element: <UnderMaintenancePage pageName="Tests" /> },
        { path: "/admin/interview", element: <UnderMaintenancePage pageName="Interview" /> },
        { path: "/admin/certificate", element: <UnderMaintenancePage pageName="Certificate" /> },
        { path: "/admin/community", element: <UnderMaintenancePage pageName="Community Manage" /> },
        { path: "/admin/teacher-management", element: <UnderMaintenancePage pageName="Teacher Management" /> },
      ];
    } else {
      return [
        ...commonRoutes,
        { path: "/add-courses", element: <UnauthorizedPage /> },
        { path: "/add-tests", element: <UnauthorizedPage /> },
        { path: "/add-videos", element: <UnauthorizedPage /> },
        { path: "/edit-video", element: <UnauthorizedPage /> },
      ];
    }
  }, [userData.role]);

  const memoizedNavbar = useMemo(() => {
    return location.pathname.startsWith("/user") ? <DashBoardNavbar /> : null;
  }, [location.pathname]);

  return (
    <DashboardContextProvider>
      <div className="h-screen flex">

        {memoizedNavbar}

        <main className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900 scrollbar-custom">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <Routes location={location} key={location.pathname}>
              {routes.map(({ path, element }) => (
                <Route key={path} path={path} element={
                  <PageTransitionSwipeAnimation>
                    {element}
                  </PageTransitionSwipeAnimation>
                } />
              ))}

              <Route path="/*" element={<PageNotFound />}/>
            </Routes>
          </Suspense>
        </main>
      </div>
    </DashboardContextProvider>
  );
};

export default DashboardRoutes;
