import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [searchTerm, filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        ...filters
      });
      const response = await axios.get(`/api/courses?${params}`);
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses', error);
      setError('Failed to load courses. Please try again later.');
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 text-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Available Courses</h2>
      <div className="row mb-4 filter-container">
        <div className="col-md-6 col-sm-12 mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="col-md-6 col-sm-12 mb-3">
          <select
            name="category"
            className="form-control"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            <option value="programming">Programming</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>
      <div className="row mb-4 filter-container">
        <div className="col-md-4 col-sm-12 mb-3">
          <select
            name="level"
            className="form-control"
            value={filters.level}
            onChange={handleFilterChange}
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div className="col-md-4 col-sm-6 mb-3">
          <input
            type="number"
            name="minPrice"
            className="form-control"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col-md-4 col-sm-6 mb-3">
          <input
            type="number"
            name="maxPrice"
            className="form-control"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      <div className="row">
        {courses.map(course => (
          <div key={course._id} className="col-lg-4 col-md-6 col-sm-12 mb-4">
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{course.title}</h5>
                <p className="card-text flex-grow-1">{course.description.substring(0, 100)}...</p>
                <p>Instructor: {course.instructor.username}</p>
                <p>Price: ${course.price}</p>
                <p>Level: {course.level}</p>
                <Link to={`/courses/${course._id}`} className="btn btn-primary btn-responsive mt-auto">
                  View Course
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CourseList;