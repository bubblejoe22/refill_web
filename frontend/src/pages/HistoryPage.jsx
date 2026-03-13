// =============================================================
// HistoryPage.jsx
// =============================================================
// Shows the order history table.
//
// ORDER NOTES reflected here:
//   Each order row shows a 📝 badge with the note count.
//   The count comes from order.order_notes[] which is nested
//   inside the OrderSerializer response (read_only).
//   Clicking "📍 Track" navigates to TrackPage where the full
//   notes CRUD panel is available.
// =============================================================

import { useOrders } from '../context/OrdersContext'

const fmt = (n) => `₱${Number(n).toLocaleString()}`

const STATUS_COLOR = {
  delivered:  { bg: '#d1fae5', color: '#059669' },
  pending:    { bg: '#fef3c7', color: '#d97706' },
  processing: { bg: '#dbeafe', color: '#1d4ed8' },
  shipped:    { bg: '#ede9fe', color: '#7c3aed' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626' },
}

export default function HistoryPage({ navigate }) {
  const { orders, loading, fetchOrders } = useOrders()

  const getStyle = (status) =>
    STATUS_COLOR[status?.toLowerCase()] || { bg: '#f1f5f9', color: '#64748b' }

  // ORDER NOTES — count how many notes are on an order
  // order.order_notes is the nested array from OrderSerializer
  const noteCount = (order) =>
    Array.isArray(order.order_notes) ? order.order_notes.length : 0

  return (
    <div>
      <div className="history-toolbar">
        <span className="toolbar-count">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
        <button className="btn-ghost" onClick={fetchOrders} disabled={loading}>
          {loading ? '⟳ Refreshing…' : '↺ Refresh'}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <span>📋</span>
          <p>No orders yet.</p>
          <button className="btn-primary" onClick={() => navigate('browse')}>Browse Stations</button>
        </div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Station / Notes</th>
                <th>Date</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Status</th>
                {/* Notes column — shows ORDER NOTE count badge */}
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const s     = getStyle(o.status)
                const nCount = noteCount(o)
                return (
                  <tr key={o.id}>
                    <td className="td-muted">#{o.id}</td>
                    <td className="td-station">{o.station || o.notes || o.shipping_address || '—'}</td>
                    <td className="td-muted">{o.date || o.created_at?.slice(0, 10) || '—'}</td>
                    <td>{o.qty || o.quantity || '—'} gal</td>
                    <td className="td-price">{fmt(o.total || o.total_price || 0)}</td>
                    <td>
                      <span className="oc-status" style={{ background: s.bg, color: s.color }}>
                        {o.status}
                      </span>
                    </td>

                    {/* ORDER NOTE count badge
                        - Shows 📝 with the number of notes on this order
                        - Clicking navigates to TrackPage where notes can be managed
                        - Notes added in OrderPage/SchedulePage appear here */}
                    <td className="td-notes">
                      {nCount > 0 ? (
                        <button
                          className="note-badge-btn"
                          onClick={() => navigate('track', { orderId: o.id })}
                          title="View notes on TrackPage">
                          📝 {nCount}
                        </button>
                      ) : (
                        <span className="td-muted">—</span>
                      )}
                    </td>

                    <td className="td-actions">
                      {['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase()) && (
                        <button className="reorder-btn" onClick={() => navigate('track', { orderId: o.id })}>
                          📍 Track
                        </button>
                      )}
                      <button className="reorder-btn" onClick={() => navigate('browse')}>↻ Reorder</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}