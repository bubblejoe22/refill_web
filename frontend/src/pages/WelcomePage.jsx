import React from 'react';
import '../styles/WelcomePageStyle.css';
import logo from '../assets/logo.png';

export default function WelcomePage({ navigate }) {
  return (
    <div className="fullscreen-welcome-container">
      <div className="welcome-overlay">
        
        <div className="welcome-content-centered">
          
          <div className="brand-header-centered">
            <img src={logo} alt="Refill on Wheels Logo" className="fullscreen-logo-centered" />
            <h2 className="brand-name-centered">REFILL ON WHEELS</h2>
          </div>

          <h1 className="fullscreen-title-centered">
            Your Ultimate Water Delivery Solution
          </h1>
          
          <p className="fullscreen-subtitle-centered">
            "Order easily, track delivery, and stay hydrated."
          </p>

          <div className="fullscreen-btn-group-vertical">
            <button 
              className="btn-get-started-wide" 
              onClick={() => navigate('register')}
            >
              GET STARTED
            </button>
            
            <button 
              className="btn-login-outline-wide" 
              onClick={() => navigate('login')}
            >
              LOG IN
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
