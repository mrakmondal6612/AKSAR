import { lazy, Suspense, useMemo } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useAuthContext } from "@/context/authContext";
const DashBoard = lazy(() => import("@/sections/DashBoardSections/DashBoard"));
const Bookmarks = lazy(() => import("@/sections/DashBoardSections/Bookmarks"));
const Courses = lazy(() => import("@/sections/DashBoardSections/Courses"));
const RefreshPage = lazy(() => import("@/sections/DashBoardSections/RefreshPage"));
const AddCourses = lazy(() => import("@/sections/DashBoardSections/AddCourses"));
const AddTests = lazy(() => import("@/sections/DashBoardSections/AddTests"));
const AdminTestPanel = lazy(() => import("../../components/test/AdminTestPanel"));
const AddVideos = lazy(() => import("@/sections/DashBoardSections/AddVideos"));
const StudentTestPanel = lazy(() => import("@/components/test/StudentTestPanel"));
const TestPortal = lazy(() => import("@/components/test/TestPortal"));
const MarksheetPortal = lazy(() => import("@/components/test/MarksheetPortal"));
const StudentCertificateView = lazy(() => import("@/components/test/CertificateView"));
const Leaderboard = lazy(() => import("@/components/test/Leaderboard"));
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
const TeachersManagement = lazy(() => import("@/sections/DashBoardSections/TeachersManagement"));
const CertificateManagement = lazy(() => import("@/sections/DashBoardSections/CertificateManagement"));
const CertificateView = lazy(() => import("@/sections/DashBoardSections/CertificateView"));
const CommunityManagement = lazy(() => import("@/sections/DashBoardSections/CommunityManagement"));
const MailTemplatesManagement = lazy(() => import("@/sections/DashBoardSections/MailTemplatesManagement"));

const BecomeInstructorPage = lazy(() => import("@/sections/DashBoardSections/BecomeInstructorPage"));

const DashboardRoutes: React.FC = () => {
  const { userData } = useAuthContext();
  const location = useLocation();

  const routes = useMemo(() => {
    if (location.pathname.startsWith("/admin")) {
      if (userData.role === "ADMIN" || userData.role === "MASTER" || userData.role === "INSTRUCTOR") {
        return [
          { path: "/courses-management", element: <CoursesManagement /> },
          { path: "/student-management", element: <StudentsManagement /> },
          { path: "/teacher-management", element: <TeachersManagement /> },
          { path: "/tests", element: <AddTests /> },
          { path: "/test-panel", element: <AdminTestPanel /> },
          { path: "/interview", element: <UnderMaintenancePage pageName="Interview" /> },
          { path: "/certificate", element: <CertificateManagement /> },
          { path: "/certificate/:marksheetId", element: <CertificateView /> },
          { path: "/community", element: <CommunityManagement /> },
          { path: "/mail-templates", element: <MailTemplatesManagement /> },
        ];
      } else {
        return [];
      }
    }

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
      { path: "/test", element: <StudentTestPanel /> },
      { path: "/test/:testId", element: <TestPortal /> },
      { path: "/marksheet", element: <MarksheetPortal /> },
      { path: "/marksheet/:marksheetId", element: <StudentCertificateView /> },
      { path: "/leaderboard/:testId?", element: <Leaderboard /> },
      { path: "/become-instructor", element: <BecomeInstructorPage /> },
    ];

    if (userData.role === "ADMIN" || userData.role === "MASTER" || userData.role === "INSTRUCTOR") {
      return [
        ...commonRoutes,
        { path: "/add-courses", element: <AddCourses /> },
        { path: "/add-tests", element: <AddTests /> },
        { path: "/add-videos", element: <AddVideos /> },
        { path: "/edit-video", element: <VideoEditPage /> },
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
  }, [userData.role, location.pathname]);

  const memoizedNavbar = useMemo(() => {
    return (location.pathname.startsWith("/user") || location.pathname.startsWith("/admin")) ? <DashBoardNavbar /> : null;
  }, [location.pathname]);

  return (
      <div className="h-screen flex">

        {memoizedNavbar}

        <main className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900 scrollbar-custom">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <Routes location={location}>
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
  );
};

export default DashboardRoutes;
