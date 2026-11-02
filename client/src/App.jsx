import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Catalog from "./pages/Catalog.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import CourseEditor from "./pages/CourseEditor.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Learners from "./pages/Learners.jsx";
import Lesson from "./pages/Lesson.jsx";
import { Login, Register } from "./pages/Auth.jsx";
import NotFound from "./pages/NotFound.jsx";
import Profile from "./pages/Profile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import Teach from "./pages/Teach.jsx";
import ThreadPage from "./pages/Thread.jsx";

const instructor = (el) => <RequireAuth role="instructor">{el}</RequireAuth>;
const signedIn = (el) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Catalog />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="courses/:slug/lessons/:lessonId" element={signedIn(<Lesson />)} />
        <Route path="courses/:slug/discussion/:threadId" element={<ThreadPage />} />
        <Route path="u/:username" element={<PublicProfile />} />
        <Route path="dashboard" element={signedIn(<Dashboard />)} />
        <Route path="profile" element={signedIn(<Profile />)} />
        <Route path="teach" element={instructor(<Teach />)} />
        <Route path="teach/new" element={instructor(<CourseEditor />)} />
        <Route path="teach/:id/edit" element={instructor(<CourseEditor />)} />
        <Route path="teach/:id/learners" element={instructor(<Learners />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
