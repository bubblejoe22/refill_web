// =============================================================
// OrderPage.jsx
// =============================================================
// CRUD: CREATE order  → POST /api/orders/
// CRUD: CREATE note   → POST /api/orders/{id}/notes/  ← ORDER NOTE
//
// ORDER NOTE flow:
//   Step 1 — customer types an optional note
//   Step 2 — note shown in review panel
//   Confirm — note saved to DB after order is created
//   TrackPage — note displayed under order details
//   HistoryPage — note count badge shown on order row
//
// FORM VALIDATION:
//   - Address required, min 10 chars
//   - Quantity min 1
//   - Note max 1000 chars
// =============================================================

import { useState } from 'react'
import { useOrders } from '../context/OrdersContext'
import { ordersAPI } from '../api/orders'

const fmt = (n) => `₱${Number(n).toLocaleString()}`

export default function OrderPage({ navigate, station }) {
  const { createOrder } = useOrders()

  const [qty,     setQty]     = useState(1)
  const [address, setAddress] = useState('Carmen, Cagayan de Oro City')
  const [type,    setType]    = useState(station?.waterTypes?.[0] || 'Purified')
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)

  // ORDER NOTE — optional message customer leaves with the order
  const [noteText, setNoteText] = useState('')

  // FORM VALIDATION — field error messages
  const [errors, setErrors] = useState({})

  if (!station) return (
    <div className="order-page">
      <div className="empty">
        <span>💧</span><p>No station selected.</p>
        <button className="btn-primary" onClick={() => navigate('browse')}>Browse Stations</button>
      </div>
    </div>
  )

  const subtotal = qty * station.pricePerGallon
  const total    = subtotal + station.deliveryFee

  // ── FORM VALIDATION ──────────────────────────────────────────
  const validateStep1 = () => {
    const e = {}
    if (!address.trim())                e.address = 'Delivery address is required.'
    else if (address.trim().length < 10) e.address = 'Please enter a complete address (at least 10 characters).'
    if (qty < 1)                         e.qty     = 'Quantity must be at least 1.'
    if (noteText.length > 1000)          e.note    = 'Note cannot exceed 1000 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleReview = () => { if (validateStep1()) setStep(2) }

  // ── CRUD: CREATE order → CREATE note ─────────────────────────
  const handleConfirm = async () => {
    setLoading(true)
    setErrors({})

    // CRUD: CREATE — place the order
    const result = await createOrder({
      shipping_address: address,
      status: 'pending',
      notes: `${qty}x ${type} from ${station.name}`,
    })

    if (!result.success) {
      const e = result.errors || {}
      setErrors({ server: e.shipping_address?.[0] || e.notes?.[0] || e.detail || 'Something went wrong.' })
      setStep(1)
      setLoading(false)
      return
    }

    const newOrderId = result.data.id

    // CRUD: CREATE note — only sent if customer typed something
    // Stored in OrderNote table as note_type: 'customer'
    // Visible in TrackPage under "Your Notes" section
    if (noteText.trim()) {
      try {
        await ordersAPI.notes.create(newOrderId, {
          content:   noteText.trim(),
          note_type: 'customer',
        })
      } catch {
        // Note save failed — order still placed, warn silently
        console.warn('Note could not be saved, but order was placed successfully.')
      }
    }

    setOrderId(newOrderId)
    setStep(3)
    setLoading(false)
  }

  return (
    <div className="order-page">

      {step < 3 && (
        <button className="order-back" onClick={() => step === 1 ? navigate('browse') : setStep(1)}>
          ← {step === 1 ? 'Back to Browse' : 'Back'}
        </button>
      )}

      {step < 3 && (
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}><span>1</span> Configure</div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}><span>2</span> Review</div>
          <div className="step-line" />
          <div className={`step ${step >= 3 ? 'active' : ''}`}><span>3</span> Confirm</div>
        </div>
      )}

      <div className="order-container">

        {step < 3 && (
          <div className="order-station-header">
            <span className="order-station-emoji">{station.emoji}</span>
            <div>
              <div className="order-station-name">{station.name}</div>
              <div className="order-station-meta">📍 {station.distance} · ⏱ {station.eta} · ⭐ {station.rating}</div>
            </div>
          </div>
        )}

        {/* ── Step 1: Configure ── */}
        {step === 1 && (
          <div className="order-layout">
            <div className="order-form">

              {errors.server && <div className="form-error-banner">⚠️ {errors.server}</div>}

              {/* Water Type */}
              <div className="form-section">
                <label className="form-label">Water Type</label>
                <div className="type-pills">
                  {station.waterTypes.map(t => (
                    <button key={t} className={`type-pill ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="form-section">
                <label className="form-label">Number of Gallons</label>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
                </div>
                {errors.qty ? <p className="field-error">{errors.qty}</p> : <p className="qty-hint">Minimum 1 gallon per order</p>}
              </div>

              {/* Address */}
              <div className="form-section">
                <label className="form-label">Delivery Address</label>
                <input
                  className={`text-inp ${errors.address ? 'inp-error' : ''}`}
                  value={address}
                  onChange={e => { setAddress(e.target.value); if (errors.address) setErrors(p => ({...p, address: null})) }}
                />
                {errors.address && <p className="field-error">{errors.address}</p>}
              </div>

              {/* ── ORDER NOTE input ──────────────────────────────────────
                  Customer types a delivery note here.
                  After order is confirmed, this is sent to:
                  POST /api/orders/{id}/notes/ → saved in OrderNote table.
                  It will appear in TrackPage under "Your Notes".
              ─────────────────────────────────────────────────────────── */}
              <div className="form-section">
                <label className="form-label">
                  Note for delivery <span className="label-optional">(optional)</span>
                </label>
                <textarea
                  className={`text-inp note-inp ${errors.note ? 'inp-error' : ''}`}
                  placeholder="e.g. Leave at the gate, call on arrival, no ice please…"
                  rows={3}
                  maxLength={1000}
                  value={noteText}
                  onChange={e => { setNoteText(e.target.value); if (errors.note) setErrors(p => ({...p, note: null})) }}
                />
                <p className={`note-char-count ${noteText.length > 900 ? 'warn' : ''}`}>
                  {noteText.length} / 1000
                </p>
                {errors.note && <p className="field-error">{errors.note}</p>}
              </div>
              {/* ── END ORDER NOTE input ── */}

            </div>

            <div className="order-summary-panel">
              <div className="price-breakdown">
                <div className="pb-title">Order Summary</div>
                <div className="price-row"><span>Water type</span><span>{type}</span></div>
                <div className="price-row"><span>Per gallon</span><span>{fmt(station.pricePerGallon)}</span></div>
                <div className="price-row"><span>Quantity</span><span>{qty} gal</span></div>
                <div className="price-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="price-row"><span>Delivery fee</span><span>{fmt(station.deliveryFee)}</span></div>
                <div className="price-row total"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
              <button className="btn-primary full" onClick={handleReview}>Review Order →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <div className="order-review">
            <h3 className="review-title">Review your order</h3>
            <div className="confirm-block">
              <div className="confirm-row"><span>Station</span><strong>{station.name}</strong></div>
              <div className="confirm-row"><span>Water Type</span><strong>{type}</strong></div>
              <div className="confirm-row"><span>Quantity</span><strong>{qty} gallon{qty > 1 ? 's' : ''}</strong></div>
              <div className="confirm-row"><span>Deliver to</span><strong>{address}</strong></div>
              <div className="confirm-row"><span>ETA</span><strong>{station.eta}</strong></div>
              {/* ORDER NOTE preview — shown only if customer typed something */}
              {noteText.trim() && (
                <div className="confirm-row note-preview-row">
                  <span>📝 Your note</span>
                  <strong className="note-preview-text">"{noteText}"</strong>
                </div>
              )}
              <div className="confirm-row highlight"><span>Total</span><strong>{fmt(total)}</strong></div>
            </div>
            <div className="modal-btns">
              <button className="btn-ghost" onClick={() => setStep(1)}>← Edit</button>
              <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Placing order…' : 'Confirm Order ✓'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && (
          <div className="success-screen">
            <div className="success-ripple"><span>💧</span></div>
            <h2>Order Placed!</h2>
            <p>Your water is on its way from<br /><strong>{station.name}</strong></p>
            <p>ETA: <strong>{station.eta}</strong></p>
            {orderId && <p className="order-id-label">Order #{orderId}</p>}
            {/* Show note confirmation on success screen */}
            {noteText.trim() && (
              <p className="success-note">📝 Note saved: <em>"{noteText}"</em></p>
            )}
            <div className="success-actions">
              <button className="btn-primary" onClick={() => navigate('track', { orderId })}>📍 Track Order</button>
              <button className="btn-ghost"   onClick={() => navigate('home')}>Back to Home</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}