import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/responsive.css';

// Component imports
import Navbar from './components/Navbar';
import Register from './components/Register';
import Login from './components/Login';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import UserDashboard from './components/UserDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import ProtectedRoute from './components/ProtectedRoute';


import Footer from './components/Footer';

// ... in the return statement, after the Routes
<Footer />

const App = () => {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<CourseList />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
          <Route path="/dashboard" element={
  <ProtectedRoute>
    <UserDashboard />
  </ProtectedRoute>
} />
<Route path="/instructor-dashboard" element={
  <ProtectedRoute>
    <InstructorDashboard />
  </ProtectedRoute>
} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;