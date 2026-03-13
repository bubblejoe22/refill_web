export default function WelcomePage({ navigate }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-bg" />
      <div className="welcome-content">
        <div className="welcome-logo">💧</div>
        <h1 className="welcome-title">Refill on Wheels</h1>
        <p className="welcome-tagline">Fresh water delivered to your door.<br />Fast, affordable, and reliable.</p>

        <div className="welcome-features">
          <div className="wf-item"><span>📍</span><span>Find nearby stations</span></div>
          <div className="wf-item"><span>⚡</span><span>Order in minutes</span></div>
          <div className="wf-item"><span>📅</span><span>Schedule deliveries</span></div>
          <div className="wf-item"><span>🔄</span><span>Track your order live</span></div>
        </div>

        <div className="welcome-actions">
          <button className="btn-primary full" onClick={() => navigate('login')}>Sign In</button>
          <button className="btn-ghost full"    onClick={() => navigate('register')}>Create Account</button>
        </div>
      </div>
    </div>
  )
}