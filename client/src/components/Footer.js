import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-light text-center text-lg-start mt-4">
      <div className="container p-4">
        <div className="row">
          <div className="col-lg-6 col-md-12 mb-4 mb-md-0">
            <h5 className="text-uppercase">About Us</h5>
            <p>
              We are a leading skill-sharing platform dedicated to providing high-quality courses
              across various disciplines. Our mission is to make learning accessible to everyone.
            </p>
          </div>
          <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
            <h5 className="text-uppercase">Links</h5>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to="/" className="text-dark">Home</Link>
              </li>
              <li>
                <Link to="/courses" className="text-dark">Courses</Link>
              </li>
              <li>
                <Link to="/about" className="text-dark">About</Link>
              </li>
              <li>
                <Link to="/contact" className="text-dark">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6 mb-4 mb-md-0">
            <h5 className="text-uppercase mb-0">Follow Us</h5>
            <ul className="list-unstyled">
              <li>
                <a href="#!" className="text-dark">Facebook</a>
              </li>
              <li>
                <a href="#!" className="text-dark">Twitter</a>
              </li>
              <li>
                <a href="#!" className="text-dark">Instagram</a>
              </li>
              <li>
                <a href="#!" className="text-dark">LinkedIn</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="text-center p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        © 2023 Skill Share Platform. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;