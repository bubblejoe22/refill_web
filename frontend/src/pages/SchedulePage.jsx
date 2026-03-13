// =============================================================
// SchedulePage.jsx
// =============================================================
// CRUD: CREATE order  → POST /api/orders/
// CRUD: CREATE note   → POST /api/orders/{id}/notes/  ← ORDER NOTE
//
// ORDER NOTE flow:
//   Customer types an optional note in the schedule form.
//   After the scheduled order is confirmed, the note is saved
//   to the OrderNote table and will appear in TrackPage.
//
// FORM VALIDATION:
//   - Date required, no past dates
//   - Time required
//   - Quantity min 1
//   - Address required, min 10 chars
//   - Note max 1000 chars
// =============================================================

import { useState } from 'react'
import { useOrders } from '../context/OrdersContext'
import { ordersAPI } from '../api/orders'

const fmt = (n) => `₱${Number(n).toLocaleString()}`

const FREQUENCIES = [
  { id: 'once',     label: 'One-time',  desc: 'Deliver once on selected date' },
  { id: 'weekly',   label: 'Weekly',    desc: 'Repeat every week' },
  { id: 'biweekly', label: 'Bi-weekly', desc: 'Repeat every 2 weeks' },
  { id: 'monthly',  label: 'Monthly',   desc: 'Repeat every month' },
]

export default function SchedulePage({ navigate, station }) {
  const { createOrder } = useOrders()

  const [form, setForm] = useState({
    date:      '',
    time:      '08:00',
    qty:       1,
    type:      station?.waterTypes?.[0] || 'Purified',
    address:   'Carmen, Cagayan de Oro City',
    frequency: 'once',
  })
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  // ORDER NOTE — optional note customer leaves with the scheduled order
  const [noteText, setNoteText] = useState('')

  // FORM VALIDATION — field error messages
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: null }))
  }

  const subtotal = form.qty * (station?.pricePerGallon || 25)
  const total    = subtotal + (station?.deliveryFee    || 20)
  const today    = new Date().toISOString().split('T')[0]

  // ── FORM VALIDATION ──────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.date)              e.date    = 'Please select a delivery date.'
    else if (form.date < today)  e.date    = 'Delivery date cannot be in the past.'
    if (!form.time)              e.time    = 'Please select a delivery time.'
    if (form.qty < 1)            e.qty     = 'Quantity must be at least 1.'
    if (!form.address.trim())    e.address = 'Delivery address is required.'
    else if (form.address.trim().length < 10) e.address = 'Please enter a complete address (at least 10 characters).'
    if (noteText.length > 1000)  e.note    = 'Note cannot exceed 1000 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── CRUD: CREATE order → CREATE note ─────────────────────────
  const handleSchedule = async () => {
    if (!validate()) return   // FORM VALIDATION — stop if any field fails

    setLoading(true)
    setErrors({})

    // CRUD: CREATE — place the scheduled order
    const result = await createOrder({
      shipping_address: form.address,
      status: 'pending',
      notes: `SCHEDULED ${form.frequency.toUpperCase()} | ${form.date} ${form.time} | ${form.qty}x ${form.type}${station ? ` from ${station.name}` : ''}`,
    })

    if (!result.success) {
      const e = result.errors || {}
      setErrors({ server: e.shipping_address?.[0] || e.notes?.[0] || e.detail || 'Something went wrong.' })
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
        console.warn('Note could not be saved, but scheduled order was placed.')
      }
    }

    setLoading(false)
    setDone(true)
  }

  // ── Success screen ────────────────────────────────────────────
  if (done) return (
    <div className="order-page">
      <div className="success-screen">
        <div className="success-ripple"><span>📅</span></div>
        <h2>Delivery Scheduled!</h2>
        <p>
          Your {FREQUENCIES.find(f => f.id === form.frequency)?.label.toLowerCase()} delivery<br />
          is set for <strong>{form.date} at {form.time}</strong>
        </p>
        {noteText.trim() && (
          <p className="success-note">📝 Note saved: <em>"{noteText}"</em></p>
        )}
        <div className="success-actions">
          <button className="btn-primary" onClick={() => navigate('history')}>View Orders</button>
          <button className="btn-ghost"   onClick={() => navigate('home')}>Back to Home</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="order-page">
      <button className="order-back" onClick={() => navigate('browse')}>← Back to Browse</button>

      <div className="order-container">

        {station && (
          <div className="order-station-header">
            <span className="order-station-emoji">{station.emoji}</span>
            <div>
              <div className="order-station-name">{station.name}</div>
              <div className="order-station-meta">📍 {station.distance} · ⭐ {station.rating}</div>
            </div>
          </div>
        )}

        <h2 className="schedule-title">Schedule a Delivery</h2>

        <div className="order-layout">
          <div className="order-form">

            {/* Server error banner */}
            {errors.server && <div className="form-error-banner">⚠️ {errors.server}</div>}

            {/* Frequency */}
            <div className="form-section">
              <label className="form-label">Frequency</label>
              <div className="freq-grid">
                {FREQUENCIES.map(f => (
                  <button key={f.id}
                    className={`freq-btn ${form.frequency === f.id ? 'active' : ''}`}
                    onClick={() => setForm(x => ({ ...x, frequency: f.id }))}>
                    <span className="freq-label">{f.label}</span>
                    <span className="freq-desc">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div className="form-row-2">
              <div className="form-section">
                <label className="form-label">Date</label>
                <input className={`text-inp ${errors.date ? 'inp-error' : ''}`} type="date" min={today} value={form.date} onChange={set('date')} />
                {errors.date && <p className="field-error">{errors.date}</p>}
              </div>
              <div className="form-section">
                <label className="form-label">Time</label>
                <input className={`text-inp ${errors.time ? 'inp-error' : ''}`} type="time" value={form.time} onChange={set('time')} />
                {errors.time && <p className="field-error">{errors.time}</p>}
              </div>
            </div>

            {/* Water Type */}
            {station && (
              <div className="form-section">
                <label className="form-label">Water Type</label>
                <div className="type-pills">
                  {station.waterTypes.map(t => (
                    <button key={t} className={`type-pill ${form.type === t ? 'active' : ''}`}
                      onClick={() => setForm(x => ({ ...x, type: t }))}>{t}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="form-section">
              <label className="form-label">Gallons</label>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setForm(x => ({ ...x, qty: Math.max(1, x.qty - 1) }))}>−</button>
                <span className="qty-val">{form.qty}</span>
                <button className="qty-btn" onClick={() => setForm(x => ({ ...x, qty: x.qty + 1 }))}>+</button>
              </div>
              {errors.qty && <p className="field-error">{errors.qty}</p>}
            </div>

            {/* Address */}
            <div className="form-section">
              <label className="form-label">Delivery Address</label>
              <input className={`text-inp ${errors.address ? 'inp-error' : ''}`} value={form.address} onChange={set('address')} />
              {errors.address && <p className="field-error">{errors.address}</p>}
            </div>

            {/* ── ORDER NOTE input ──────────────────────────────────────
                Customer types a delivery note here.
                After schedule is confirmed, this is sent to:
                POST /api/orders/{id}/notes/ → saved in OrderNote table.
                It will appear in TrackPage under "Your Notes".
            ─────────────────────────────────────────────────────────── */}
            <div className="form-section">
              <label className="form-label">
                Note for delivery <span className="label-optional">(optional)</span>
              </label>
              <textarea
                className={`text-inp note-inp ${errors.note ? 'inp-error' : ''}`}
                placeholder="e.g. Knock loudly, leave at door, call before arriving…"
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

          {/* Summary panel */}
          <div className="order-summary-panel">
            <div className="price-breakdown">
              <div className="pb-title">Schedule Summary</div>
              <div className="price-row"><span>Frequency</span><span>{FREQUENCIES.find(f => f.id === form.frequency)?.label}</span></div>
              <div className="price-row"><span>Date</span><span>{form.date || '—'}</span></div>
              <div className="price-row"><span>Time</span><span>{form.time}</span></div>
              <div className="price-row"><span>Quantity</span><span>{form.qty} gal</span></div>
              {station && <>
                <div className="price-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="price-row"><span>Delivery fee</span><span>{fmt(station.deliveryFee)}</span></div>
                <div className="price-row total"><span>Per delivery</span><span>{fmt(total)}</span></div>
              </>}
              {/* ORDER NOTE preview in summary panel */}
              {noteText.trim() && (
                <div className="price-row note-summary-row">
                  <span>📝 Note</span>
                  <span className="note-summary-preview">{noteText.length > 40 ? noteText.slice(0, 40) + '…' : noteText}</span>
                </div>
              )}
            </div>
            {/* FORM VALIDATION + CRUD: CREATE triggered here */}
            <button className="btn-primary full" onClick={handleSchedule} disabled={loading}>
              {loading ? 'Scheduling…' : '📅 Confirm Schedule'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}