import { useEffect, useRef } from 'react'
import { useNotifications } from '../context/NotificationContext'
import "./NotificationModalStyle.css"

const TYPE_CONFIG = {
  order_placed:     { icon: '📋', color: '#d97706', label: 'Order Placed'     },
  order_processing: { icon: '⚙️',  color: '#1d4ed8', label: 'Processing'       },
  order_shipped:    { icon: '🚚', color: '#7c3aed', label: 'Out for Delivery' },
  order_delivered:  { icon: '✅', color: '#059669', label: 'Delivered'         },
  order_cancelled:  { icon: '❌', color: '#dc2626', label: 'Cancelled'         },
}

const DEFAULT_CONFIG = { icon: '🔔', color: '#64748b', label: 'Notification' }

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000 
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationModal({ onClose, navigate }) {
  const { notifications, loading, markRead, markAllRead, unreadCount } = useNotifications()
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleClick = async (notif) => {
    if (!notif.is_read) await markRead(notif.id)
    onClose()
    if (notif.order_id && ['order_placed','order_processing','order_shipped','order_delivered'].includes(notif.notif_type)) {
      navigate('track', { orderId: notif.order_id })
    } else if (notif.order_id && notif.notif_type === 'order_cancelled') {
      navigate('history')
    }
  }

  return (
    <div className="notif-panel" ref={panelRef}>

      {/* ── Header ── */}
      <div className="notif-header">
        <span className="notif-title">Notifications</span>
        {unreadCount > 0 && (
          <button className="notif-mark-all" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div className="notif-list">
        {loading && notifications.length === 0 && (
          <div className="notif-empty">Loading…</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="notif-empty">
            <span>🔔</span>
            <p>No notifications yet.</p>
            <p className="notif-empty-sub">Order status updates will appear here.</p>
          </div>
        )}

        {notifications.map(notif => {
          console.log('notif:', notif)
          const cfg = TYPE_CONFIG[notif.notif_type] || DEFAULT_CONFIG
          return (
            <button
              key={notif.id}
              className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
              onClick={() => handleClick(notif)}
            >
              {/* Unread dot */}
              {!notif.is_read && <span className="notif-dot" />}

              {/* Status icon */}
              <div className="notif-icon-wrap" style={{ background: cfg.color + '18' }}>
                <span className="notif-icon">{cfg.icon}</span>
              </div>

              {/* Text */}
              <div className="notif-text-block">
                <p className="notif-message">{notif.message}</p>
                <span className="notif-time">{timeAgo(notif.created_at)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Footer ── */}
      {notifications.length > 0 && (
        <div className="notif-footer">
          <button className="notif-view-all" onClick={() => { onClose(); navigate('history') }}>
            View all orders →
          </button>
        </div>
      )}
    </div>
  )
}