import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/enrolled-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEnrolledCourses(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching enrolled courses', error);
        setError('Failed to load enrolled courses. Please try again later.');
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 text-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>My Dashboard</h2>
      <h3 className="mb-4">Enrolled Courses</h3>
      {enrolledCourses.length === 0 ? (
        <p>You are not enrolled in any courses yet.</p>
      ) : (
        <div className="row">
          {enrolledCourses.map(course => (
            <div key={course._id} className="col-md-4 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text">{course.description.substring(0, 100)}...</p>
                  <Link to={`/courses/${course._id}`} className="btn btn-primary">
                    Continue Learning
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

export default UserDashboard;