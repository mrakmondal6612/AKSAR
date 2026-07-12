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
const AdminTestPanel = lazy(() => import("@/components/test/AdminTestPanel"));
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
const StudentsManagement = lazy(() => import("@/sections/DashBoardSections/StudentsManagement"));
const CertificateManagement = lazy(() => import("@/sections/DashBoardSections/CertificateManagement"));
const CertificateView = lazy(() => import("@/sections/DashBoardSections/CertificateView"));
const CommunityManagement = lazy(() => import("@/sections/DashBoardSections/CommunityManagement"));

const BecomeInstructorPage = lazy(() => import("@/sections/DashBoardSections/BecomeInstructorPage"));

const RequestsManagement = lazy(() => import("@/sections/DashBoardSections/RequestsManagement"));

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
      { path: "/test/:testId", element: <UnderMaintenancePage pageName="Test Portal" /> },
      { path: "/marksheet", element: <UnderMaintenancePage pageName="Marksheet" /> },
      { path: "/marksheet/:marksheetId", element: <UnderMaintenancePage pageName="Certificate" /> },
      { path: "/leaderboard/:testId?", element: <UnderMaintenancePage pageName="Leaderboard" /> },
      { path: "/become-instructor", element: <BecomeInstructorPage /> },
    ];

    // To:
    if (userData.role === "ADMIN" || userData.role === "MASTER" || userData.role === "INSTRUCTOR") {
      return [
        ...commonRoutes,
        { path: "/add-courses", element: <AddCourses /> },
        { path: "/add-tests", element: <AddTests /> },
        { path: "/add-videos", element: <AddVideos /> },
        { path: "/edit-video", element: <VideoEditPage /> },
        { path: "/admin/courses-management", element: <CoursesManagement /> },
        { path: "/admin/student-management", element: <StudentsManagement /> },
        { path: "/admin/tests", element: <AddTests /> },
        { path: "/admin/test-panel", element: <AdminTestPanel /> },
        { path: "/admin/interview", element: <UnderMaintenancePage pageName="Interview" /> },
        { path: "/admin/certificate", element: <CertificateManagement /> },
        { path: "/admin/certificate/:marksheetId", element: <CertificateView /> },
        { path: "/admin/community", element: <CommunityManagement /> },
        { path: "/admin/teacher-management", element: <UnderMaintenancePage pageName="Teacher Management" /> },
        { path: "/admin/requests", element: <RequestsManagement /> },
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
