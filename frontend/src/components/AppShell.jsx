import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../context/OrdersContext'
import { useNotifications } from '../context/NotificationContext'
import NotificationModal from '../modals/NotificationModal'

const NAV = [
  { id: 'home',    icon: '🏠', label: 'Home' },
  { id: 'browse',  icon: '🛒', label: 'Browse' },
  { id: 'history', icon: '📋', label: 'My Orders' },
  { id: 'track',   icon: '📍', label: 'Track' },
  { id: 'profile', icon: '👤', label: 'Profile' },
]

export default function AppShell({ page, navigate, children }) {
  const { user, logout } = useAuth()
  const { orders } = useOrders()
  const { unreadCount, fetchNotifications } = useNotifications()
  const [showNotifs, setShowNotifs] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U'

  const handleBell = () => {
    fetchNotifications()
    setShowNotifs(v => !v)
  }

  const handleLogout = async () => {
    await logout()
    navigate('welcome')
  }

  const handleNav = (id) => {
    navigate(id)
    setSidebarOpen(false)  // close sidebar after navigation on mobile
  }

  return (
    <div className="app">
      {/* Overlay — shown behind sidebar on mobile when open */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-drop">💧</div>
          <div>
            <div className="brand-name">Refill on Wheels</div>
            <div className="brand-sub">Water Delivery</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-uname">{user?.username}</div>
            <div className="sidebar-uloc">{user?.email || 'Carmen, CDO'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'nav-active' : ''}`}
              onClick={() => handleNav(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-stats">
          <div className="sstat">
            <div className="sstat-val">{orders.length}</div>
            <div className="sstat-label">Orders</div>
          </div>
          <div className="sstat">
            <div className="sstat-val">{orders.reduce((a, o) => a + (o.qty || o.quantity || 0), 0)}</div>
            <div className="sstat-label">Gallons</div>
          </div>
        </div>
      </aside>

      <header className="top-header">
        {/* Hamburger button — only visible on mobile */}
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-icon ${sidebarOpen ? 'open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>

        <div className="header-left">
          <h1 className="page-title">
            {NAV.find(n => n.id === page)?.icon}{' '}
            {NAV.find(n => n.id === page)?.label}
          </h1>
          <p className="page-sub">Carmen, Cagayan de Oro City</p>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
          <div className="notif-btn-wrap">
            <button className="notif-btn" onClick={handleBell}>
              🔔
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifs && (
              <NotificationModal
                onClose={() => setShowNotifs(false)}
                navigate={navigate}
              />
            )}
          </div>
        </div>
      </header>

      <main className="main-area">
        {children}
      </main>
    </div>
  )
}