import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Navbar = () => {

  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/login');
  };


  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">SkillShare</Link>
        <div className="navbar-nav">
          <Link className="nav-link" to="/">Courses</Link>
          {isLoggedIn ? (
            <>
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
              <button className="nav-link btn btn-link" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">Login</Link>
              <Link className="nav-link" to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;