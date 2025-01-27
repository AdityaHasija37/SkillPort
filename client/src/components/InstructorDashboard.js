import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInstructorCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/courses/instructor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching instructor courses', error);
        setError('Failed to load courses. Please try again later.');
        setLoading(false);
      }
    };

    fetchInstructorCourses();
  }, []);

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 text-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>Instructor Dashboard</h2>
      <Link to="/create-course" className="btn btn-primary mb-4">Create New Course</Link>
      <h3>Your Courses</h3>
      {courses.length === 0 ? (
        <p>You haven't created any courses yet.</p>
      ) : (
        <div className="row">
          {courses.map(course => (
            <div key={course._id} className="col-md-4 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text">{course.description.substring(0, 100)}...</p>
                  <p>Enrolled Students: {course.enrolledStudents.length}</p>
                  <Link to={`/edit-course/${course._id}`} className="btn btn-secondary mr-2">
                    Edit Course
                  </Link>
                  <Link to={`/course-analytics/${course._id}`} className="btn btn-info">
                    View Analytics
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;