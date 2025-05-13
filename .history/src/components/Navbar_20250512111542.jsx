import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => (
  <nav className="navbar">
    <div className="navbar-logo">NFC BizCard</div>
    <ul className="navbar-links">
      <li><Link to="/">Home</Link></li>
      <li><Link to="/about">About</Link></li>
      <li><Link to="/pricing">Pricing</Link></li>
      <li><Link to="/contact">Contact</Link></li>
      <li><Link to="/dashboard">Dashboard</Link></li>
    </ul>
  </nav>
);

export default Navbar;