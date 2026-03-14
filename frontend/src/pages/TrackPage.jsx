// =============================================================
// TrackPage.jsx
// =============================================================

import { useState, useEffect } from 'react'
import { useOrders } from '../context/OrdersContext'
import { ordersAPI } from '../api/orders'

const STEPS = [
  { id: 'pending',    icon: '📋', label: 'Order Placed',    desc: 'Your order has been received' },
  { id: 'processing', icon: '⚙️',  label: 'Processing',      desc: 'Station is preparing your water' },
  { id: 'shipped',    icon: '🚚', label: 'Out for Delivery', desc: 'Driver is on the way' },
  { id: 'delivered',  icon: '✅', label: 'Delivered',        desc: 'Order successfully delivered' },
]
const STEP_INDEX = { pending: 0, processing: 1, shipped: 2, delivered: 3 }
const CANCELLABLE_STATUSES = ['pending', 'processing']

// Orders can only be cancelled before they're shipped
const CANCELLABLE_STATUSES = ['pending', 'processing']

export default function TrackPage({ navigate, orderId, order: passedOrder }) {
  const { orders, refreshOrders } = useOrders()
  const [order, setOrder]               = useState(passedOrder || null)
  const [loading, setLoading]           = useState(false)
  const [selectedId, setSelectedId]     = useState(orderId || null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling]     = useState(false)
  const [cancelError, setCancelError]   = useState(null)

  const [notes, setNotes]               = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [newNote, setNewNote]           = useState('')
  const [noteError, setNoteError]       = useState('')
  const [editingNote, setEditingNote]   = useState(null)
  const [editError, setEditError]       = useState('')
  const [savingNote, setSavingNote]     = useState(false)

  const fetchNotes = (id) => {
    setNotesLoading(true)
    ordersAPI.notes.getAll(id)
      .then(r => {
        const data = r.data
        setNotes(Array.isArray(data) ? data : (data.results ?? []))
      })
      .catch(() => setNotes([]))
      .finally(() => setNotesLoading(false))
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    if (newNote.length > 1000) { setNoteError('Note cannot exceed 1000 characters.'); return }
    setSavingNote(true); setNoteError('')
    try {
      await ordersAPI.notes.create(order.id, { content: newNote.trim(), note_type: 'customer' })
      setNewNote(''); fetchNotes(order.id)
    } catch { setNoteError('Failed to save note. Please try again.') }
    finally { setSavingNote(false) }
  }

  const handleSaveEdit = async () => {
    if (!editingNote.content.trim()) { setEditError('Note cannot be empty.'); return }
    if (editingNote.content.length > 1000) { setEditError('Note cannot exceed 1000 characters.'); return }
    setSavingNote(true); setEditError('')
    try {
      await ordersAPI.notes.update(order.id, editingNote.id, { content: editingNote.content.trim() })
      setEditingNote(null); fetchNotes(order.id)
    } catch { setEditError('Failed to update note. Please try again.') }
    finally { setSavingNote(false) }
  }

  const handleDeleteNote = async (noteId) => {
    try { await ordersAPI.notes.delete(order.id, noteId); fetchNotes(order.id) }
    catch { /* silently ignore */ }
  }

  const activeOrders = orders.filter(o =>
    ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase())
  )

  useEffect(() => {
    if (selectedId) {
      setLoading(true)
      ordersAPI.getById(selectedId)
        .then(r => { setOrder(r.data); fetchNotes(r.data.id) })
        .catch(() => {
          const found = orders.find(o => o.id === selectedId)
          if (found) { setOrder(found); fetchNotes(found.id) }
        })
        .finally(() => setLoading(false))
    } else if (activeOrders.length > 0 && !order) {
      const first = activeOrders[0]
      setOrder(first); setSelectedId(first.id); fetchNotes(first.id)
    }
  }, [selectedId])

  const handleCancelOrder = async () => {
    setCancelling(true); setCancelError(null)
    try {
      await ordersAPI.updateStatus(order.id, 'cancelled')
      setOrder(prev => ({ ...prev, status: 'cancelled' }))
      setConfirmCancel(false)
      if (typeof refreshOrders === 'function') refreshOrders()
    } catch { setCancelError('Failed to cancel order. Please try again.') }
    finally { setCancelling(false) }
  }

  const currentStep   = STEP_INDEX[order?.status?.toLowerCase()] ?? 0
  const isCancelled   = order?.status?.toLowerCase() === 'cancelled'
  const isCancellable = CANCELLABLE_STATUSES.includes(order?.status?.toLowerCase())

  // ✅ total_price is computed server-side by Django's compute_total() from OrderItems
  const displayTotal = order?.total_price ?? 0

  // ✅ qty comes from summing the items array (Django doesn't store qty on the order itself)
  const displayQty = order?.items?.length > 0
    ? order.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
    : (order?.qty ?? '—')

  return (
    <div className="track-page">

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
            <div className="track-order-detail">
              {order.station || order.notes || order.shipping_address || '—'}
            </div>
            <div className="track-order-meta">
              <span>📅 {order.date || order.created_at?.slice(0, 10) || '—'}</span>
              {/* ✅ qty summed from items; total from total_price */}
              <span>💧 {displayQty !== '—' ? `${displayQty} gal` : '—'}</span>
              <span>₱{Number(displayTotal).toLocaleString()}</span>
            </div>
          </div>

          {isCancelled ? (
            <div className="track-cancelled">
              <span>❌</span>
              <p>This order was cancelled.</p>
              <button className="btn-primary" onClick={() => navigate('browse')}>Place New Order</button>
            </div>
          ) : (
            <>
              <div className="track-progress-wrap">
                <div className="track-progress-bar">
                  <div className="track-progress-fill"
                    style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
                </div>
              </div>

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
                  <button className="btn-primary" onClick={() => navigate('browse')} style={{ marginTop: '12px' }}>
                    Order Again
                  </button>
                </div>
              )}

              {isCancellable && (
                <div className="track-cancel-wrap">
                  {!confirmCancel ? (
                    <button className="btn-cancel-order"
                      onClick={() => { setConfirmCancel(true); setCancelError(null) }}>
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

          {/* ORDER NOTES */}
          <div className="notes-section">
            <div className="notes-header">
              <span className="notes-title">📝 Your Notes</span>
              {notes.length > 0 && (
                <span className="notes-count">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {notesLoading ? (
              <p className="notes-loading">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="notes-empty">No notes yet. Add one below.</p>
            ) : (
              <div className="notes-list">
                {notes.map(note => (
                  <div key={note.id} className="note-item">
                    {editingNote?.id === note.id ? (
                      <div className="note-edit-mode">
                        <textarea
                          className={`text-inp note-inp ${editError ? 'inp-error' : ''}`}
                          rows={3} maxLength={1000} value={editingNote.content}
                          onChange={e => {
                            setEditingNote(prev => ({ ...prev, content: e.target.value }))
                            if (editError) setEditError('')
                          }}
                        />
                        <p className={`note-char-count ${editingNote.content.length > 900 ? 'warn' : ''}`}>
                          {editingNote.content.length} / 1000
                        </p>
                        {editError && <p className="field-error">{editError}</p>}
                        <div className="note-edit-btns">
                          <button className="btn-ghost note-btn"
                            onClick={() => { setEditingNote(null); setEditError('') }}>Cancel</button>
                          <button className="btn-primary note-btn" onClick={handleSaveEdit} disabled={savingNote}>
                            {savingNote ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="note-read-mode">
                        <p className="note-content">"{note.content}"</p>
                        <div className="note-meta">
                          <span className="note-date">
                            {note.created_at
                              ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </span>
                          <div className="note-actions">
                            <button className="note-action-btn edit-btn"
                              onClick={() => { setEditingNote({ id: note.id, content: note.content }); setEditError('') }}>
                              ✏️ Edit
                            </button>
                            <button className="note-action-btn delete-btn"
                              onClick={() => handleDeleteNote(note.id)}>
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="note-add-form">
              <label className="form-label">Add a note</label>
              <textarea
                className={`text-inp note-inp ${noteError ? 'inp-error' : ''}`}
                placeholder="e.g. Leave at the gate, call before arriving…"
                rows={2} maxLength={1000} value={newNote}
                onChange={e => { setNewNote(e.target.value); if (noteError) setNoteError('') }}
              />
              <div className="note-add-footer">
                <p className={`note-char-count ${newNote.length > 900 ? 'warn' : ''}`}>
                  {newNote.length} / 1000
                </p>
                {noteError && <p className="field-error">{noteError}</p>}
                <button className="btn-primary note-submit-btn"
                  onClick={handleAddNote}
                  disabled={savingNote || !newNote.trim()}>
                  {savingNote ? 'Saving…' : '+ Add Note'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}