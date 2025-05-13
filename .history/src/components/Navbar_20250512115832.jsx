import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav className="navbar">
    <div className="navbar-logo">
      <span className="logo-e">E</span>-vox
      <span className="logo-tagline">eco-friendly cards</span>
    </div>
    <ul className="navbar-links">
      <li><Link to="/">Home</Link></li>
      <li><Link to="/about">About</Link></li>
      <li><Link to="/pricing">Pricing</Link></li>
      <li><Link to="/contact">Contact</Link></li>
      <li><Link to="/login" className="login-link">Login</Link></li>
    </ul>
  </nav>
);

export default Navbar;