import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/enrolled-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEnrolledCourses(response.data);
      } catch (error) {
        console.error('Error fetching enrolled courses', error);
      }
    };

    fetchEnrolledCourses();
  }, []);

  return (
    <div className="container mt-4">
      <h2>My Dashboard</h2>
      <h3>Enrolled Courses</h3>
      {enrolledCourses.length === 0 ? (
        <p>You are not enrolled in any courses yet.</p>
      ) : (
        <ul className="list-group">
          {enrolledCourses.map(course => (
            <li key={course._id} className="list-group-item">
              <h5>{course.title}</h5>
              <p>{course.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;