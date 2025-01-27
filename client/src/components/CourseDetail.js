import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/responsive.css';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';

const CourseDetail = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const { id } = useParams();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`/api/courses/${id}`);
        setCourse(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course details', error);
        setError('Failed to load course details. Please try again later.');
        setLoading(false);
      }
    };

    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/courses/${id}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProgress(response.data.progress);
      } catch (error) {
        console.error('Error fetching course progress', error);
      }
    };

    fetchCourse();
    fetchProgress();
  }, [id]);

  const handleEnroll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/courses/${id}/enroll`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Successfully enrolled in the course!');
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Error enrolling in the course: ${error.response.data.error}`);
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response received from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Error enrolling in the course. Please try again.');
      }
    }
  };

  const updateProgress = async (newProgress) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/courses/${id}/progress`, 
        { progress: newProgress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProgress(newProgress);
    } catch (error) {
      console.error('Error updating course progress', error);
    }
  };

  const generateCertificate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/courses/${id}/certificate`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${course.title}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      alert('Error generating certificate. Make sure you have completed the course.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!course) return <ErrorMessage message="Course not found." />;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-lg-8 col-md-12">
          <h2 className="mb-4">{course.title}</h2>
          <p className="lead">{course.description}</p>
          <div className="progress mb-4">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{width: `${progress}%`}} 
              aria-valuenow={progress} 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {progress}% Complete
            </div>
          </div>
          <h3 className="mb-3">Course Content</h3>
          <div className="accordion" id="lessonsAccordion">
            {course.lessons.map((lesson, index) => (
              <div className="accordion-item" key={index}>
                <h2 className="accordion-header" id={`heading${index}`}>
                  <button 
                    className="accordion-button collapsed" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target={`#collapse${index}`} 
                    aria-expanded="false" 
                    aria-controls={`collapse${index}`}
                  >
                    {lesson.title}
                  </button>
                </h2>
                <div 
                  id={`collapse${index}`} 
                  className="accordion-collapse collapse" 
                  aria-labelledby={`heading${index}`} 
                  data-bs-parent="#lessonsAccordion"
                >
                  <div className="accordion-body">
                    <p>{lesson.content}</p>
                    <small>Duration: {lesson.duration}</small>
                    <button 
                      className="btn btn-sm btn-success mt-2" 
                      onClick={() => updateProgress(((index + 1) / course.lessons.length) * 100)}
                    >
                      Mark as Completed
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-lg-4 col-md-12 mt-4 mt-lg-0">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Course Details</h5>
              <p><strong>Instructor:</strong> {course.instructor.username}</p>
              <p><strong>Category:</strong> {course.category}</p>
              <p><strong>Level:</strong> {course.level}</p>
              <p><strong>Duration:</strong> {course.duration}</p>
              <h5 className="mt-4">Price: ${course.price}</h5>
              <button className="btn btn-primary btn-lg btn-block mt-3" onClick={handleEnroll}>
                Enroll Now
              </button>
              {progress === 100 && (
                <button className="btn btn-success btn-lg btn-block mt-3" onClick={generateCertificate}>
                  Generate Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;