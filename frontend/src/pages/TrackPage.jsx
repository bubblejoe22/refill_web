import { useState, useEffect } from 'react'
import { useOrders } from '../context/OrdersContext'
import { ordersAPI } from '../api/orders'

const STEPS = [
  { id: 'pending',    icon: '📋', label: 'Order Placed',     desc: 'Your order has been received' },
  { id: 'processing', icon: '⚙️',  label: 'Processing',       desc: 'Station is preparing your water' },
  { id: 'shipped',    icon: '🚚', label: 'Out for Delivery',  desc: 'Driver is on the way' },
  { id: 'delivered',  icon: '✅', label: 'Delivered',         desc: 'Order successfully delivered' },
]

const STEP_INDEX = { pending: 0, processing: 1, shipped: 2, delivered: 3 }

// Orders can only be cancelled before they're shipped
const CANCELLABLE_STATUSES = ['pending', 'processing']

export default function TrackPage({ navigate, orderId, order: passedOrder }) {
  const { orders, refreshOrders } = useOrders()
  const [order, setOrder]           = useState(passedOrder || null)
  const [loading, setLoading]       = useState(false)
  const [selectedId, setSelectedId] = useState(orderId || null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling]       = useState(false)
  const [cancelError, setCancelError]     = useState(null)

  // Active orders from context
  const activeOrders = orders.filter(o =>
    ['pending','processing','shipped'].includes(o.status?.toLowerCase())
  )

  useEffect(() => {
    if (selectedId) {
      setLoading(true)
      ordersAPI.getById(selectedId)
        .then(r => setOrder(r.data))
        .catch(() => {
          const found = orders.find(o => o.id === selectedId)
          if (found) setOrder(found)
        })
        .finally(() => setLoading(false))
    } else if (activeOrders.length > 0 && !order) {
      setOrder(activeOrders[0])
      setSelectedId(activeOrders[0].id)
    }
  }, [selectedId])

  const handleCancelOrder = async () => {
    setCancelling(true)
    setCancelError(null)
    try {
      await ordersAPI.updateStatus(order.id, 'cancelled')
      setOrder(prev => ({ ...prev, status: 'cancelled' }))
      setConfirmCancel(false)
      // Refresh orders list in context if available
      if (typeof refreshOrders === 'function') refreshOrders()
    } catch (err) {
      setCancelError('Failed to cancel order. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const currentStep  = STEP_INDEX[order?.status?.toLowerCase()] ?? 0
  const isCancelled  = order?.status?.toLowerCase() === 'cancelled'
  const isCancellable = CANCELLABLE_STATUSES.includes(order?.status?.toLowerCase())

  return (
    <div className="track-page">
      {/* Order selector */}
      {activeOrders.length > 1 && (
        <div className="track-selector">
          <label className="form-label">Select Order to Track</label>
          <div className="track-order-pills">
            {activeOrders.map(o => (
              <button key={o.id}
                className={`track-pill ${selectedId === o.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(o.id); setOrder(o); setConfirmCancel(false) }}>
                #{o.id} — {o.station || o.shipping_address || 'Order'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="empty"><p>Loading order…</p></div>}

      {!order && !loading && (
        <div className="empty">
          <span>📍</span>
          <p>No active orders to track.</p>
          <button className="btn-primary" onClick={() => navigate('browse')}>Place an Order</button>
        </div>
      )}

      {order && !loading && (
        <div className="track-container">
          {/* Order info card */}
          <div className="track-info-card">
            <div className="track-order-id">Order #{order.id}</div>
            <div className="track-order-detail">{order.station || order.notes || order.shipping_address || '—'}</div>
            <div className="track-order-meta">
              <span>📅 {order.date || order.created_at?.slice(0,10) || '—'}</span>
              <span>💧 {order.qty || order.quantity || '—'} gal</span>
              <span>₱{order.total || order.total_price || 0}</span>
            </div>
          </div>

          {/* Cancelled state */}
          {isCancelled ? (
            <div className="track-cancelled">
              <span>❌</span>
              <p>This order was cancelled.</p>
              <button className="btn-primary" onClick={() => navigate('browse')}>Place New Order</button>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="track-progress-wrap">
                <div className="track-progress-bar">
                  <div className="track-progress-fill" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
                </div>
              </div>

              {/* Steps timeline */}
              <div className="track-steps">
                {STEPS.map((s, i) => {
                  const done    = i < currentStep
                  const current = i === currentStep
                  return (
                    <div key={s.id} className={`track-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                      <div className="ts-icon-wrap">
                        <div className="ts-icon">{s.icon}</div>
                        {i < STEPS.length - 1 && <div className={`ts-line ${done ? 'done' : ''}`} />}
                      </div>
                      <div className="ts-content">
                        <div className="ts-label">{s.label}</div>
                        <div className="ts-desc">{current ? <strong>{s.desc}</strong> : s.desc}</div>
                        {current && <div className="ts-now-badge">Now</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ETA */}
              {order.status?.toLowerCase() !== 'delivered' && (
                <div className="track-eta">
                  <span>⏱</span>
                  <div>
                    <div className="eta-label">Estimated Arrival</div>
                    <div className="eta-val">15–25 minutes</div>
                  </div>
                </div>
              )}

              {order.status?.toLowerCase() === 'delivered' && (
                <div className="track-delivered-banner">
                  ✅ Delivered! Enjoy your fresh water.
                  <button className="btn-primary" onClick={() => navigate('browse')} style={{marginTop:'12px'}}>
                    Order Again
                  </button>
                </div>
              )}

              {/* Cancel order section — only shown for pending/processing */}
              {isCancellable && (
                <div className="track-cancel-wrap">
                  {!confirmCancel ? (
                    <button
                      className="btn-cancel-order"
                      onClick={() => { setConfirmCancel(true); setCancelError(null) }}
                    >
                      Cancel Order
                    </button>
                  ) : (
                    <div className="track-cancel-confirm">
                      <p>Are you sure you want to cancel this order?</p>
                      {cancelError && <p className="cancel-error">{cancelError}</p>}
                      <div className="cancel-confirm-actions">
                        <button
                          className="btn-cancel-confirm"
                          onClick={handleCancelOrder}
                          disabled={cancelling}
                        >
                          {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                        </button>
                        <button
                          className="btn-cancel-dismiss"
                          onClick={() => { setConfirmCancel(false); setCancelError(null) }}
                          disabled={cancelling}
                        >
                          Keep Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}