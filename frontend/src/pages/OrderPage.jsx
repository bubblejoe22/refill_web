import { useState } from 'react'
import { useOrders } from '../context/OrdersContext'
import { ordersAPI } from '../api/orders'
import './order.css'

const fmt = (n) => `₱${Number(n).toLocaleString()}`

const STEPS = ['Configure', 'Review', 'Confirm']

export default function OrderPage({ navigate, station }) {
  const { createOrder } = useOrders()

  const [qty,      setQty]      = useState(1)
  const [address,  setAddress]  = useState('Carmen, Cagayan de Oro City')
  const [type,     setType]     = useState(station?.waterTypes?.[0] || 'Purified')
  const [step,     setStep]     = useState(1)
  const [loading,  setLoading]  = useState(false)
  const [orderId,  setOrderId]  = useState(null)
  const [noteText, setNoteText] = useState('')
  const [errors,   setErrors]   = useState({})

  if (!station) return (
    <div className="op-page">
      <div className="op-card" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>💧</div>
          <p style={{ color:'var(--muted)', marginBottom:16 }}>No station selected.</p>
          <button className="op-btn-primary" onClick={() => navigate('browse')}>Browse Stations</button>
        </div>
      </div>
    </div>
  )

  const subtotal = qty * station.pricePerGallon
  const total    = subtotal + (station.deliveryFee || 0)

  const validate = () => {
    const e = {}
    if (!address.trim())                 e.address = 'Delivery address is required.'
    else if (address.trim().length < 10) e.address = 'Please enter a complete address (at least 10 chars).'
    if (qty < 1)                         e.qty     = 'Quantity must be at least 1.'
    if (noteText.length > 1000)          e.note    = 'Note cannot exceed 1000 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleReview = () => { if (validate()) setStep(2) }

  const handleConfirm = async () => {
    setLoading(true); setErrors({})

    const result = await createOrder({
      shipping_address: address,
      status:           'pending',
      notes:            `${qty}x ${type} from ${station.name}`,
    })

    if (!result.success) {
      const e = result.errors || {}
      setErrors({ server: e.shipping_address?.[0] || e.notes?.[0] || e.detail || 'Something went wrong.' })
      setStep(1); setLoading(false); return
    }

    const newOrderId = result.data.id

    try {
      await ordersAPI.items.create(newOrderId, {
        product_id: station.id,
        quantity:   qty,
        price:      station.pricePerGallon,
      })
    } catch (err) {
      console.warn('Item creation failed:', err.response?.data)
    }

    if (noteText.trim()) {
      try { await ordersAPI.notes.create(newOrderId, { content: noteText.trim(), note_type: 'customer' }) }
      catch { console.warn('Note save failed, order was still placed.') }
    }

    setOrderId(newOrderId); setStep(3); setLoading(false)
  }

  if (step === 3) return (
    <div className="op-page">
      <div className="op-card">
        <div className="op-sidebar">
          <div className="op-sidebar__title">Order<br />Complete</div>
          <div className="op-station-pill">
            <div className="op-station-pill__icon">{station.emoji || '💧'}</div>
            <div>
              <div className="op-station-pill__name">{station.name}</div>
              <div className="op-station-pill__meta"><span>Order #{orderId}</span></div>
            </div>
          </div>
        </div>
        <div className="op-content">
          <div className="op-success">
            <div className="op-success__orb">💧</div>
            <h2 className="op-success__title">Order Placed!</h2>
            <p className="op-success__sub">
              Your water is on its way from <strong>{station.name}</strong>
            </p>
            <p className="op-success__eta">ETA: <strong>{station.eta || '—'}</strong></p>
            {orderId && <div className="op-success__id">Order #{orderId}</div>}
            {noteText.trim() && <div className="op-success__note">📝 Note saved: <em>"{noteText}"</em></div>}
            <div className="op-success__actions">
              <button className="op-btn-primary" onClick={() => navigate('track', { orderId })}>📍 Track Order</button>
              <button className="op-btn-ghost"   onClick={() => navigate('home')}>Back to Home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="op-page">
      <div className="op-card">

        {/* ── Sidebar ── */}
        <div className="op-sidebar">
          <button className="op-sidebar__back"
            onClick={() => step === 1 ? navigate('browse') : setStep(step - 1)}>
            ← {step === 1 ? 'Back to Browse' : 'Back'}
          </button>

          <div className="op-sidebar__title">Place an<br />Order</div>

          <div className="op-steps">
            {STEPS.map((label, i) => {
              const s      = i + 1
              const isLast = i === STEPS.length - 1
              const isDone   = step > s
              const isActive = step === s
              return (
                <div key={label} className="op-step">
                  <div className="op-step__track">
                    <div className={`op-step__circle${isActive ? ' op-step--active' : ''}${isDone ? ' op-step--done' : ''}`}>
                      {isDone ? '✓' : s}
                    </div>
                    {!isLast && (
                      <div className="op-step__line"
                        style={{ background: isDone ? 'var(--blue-mid)' : 'rgba(255,255,255,.15)' }} />
                    )}
                  </div>
                  <div className="op-step__info">
                    <div className={`op-step__label${isActive ? ' op-step--active' : ''}${isDone ? ' op-step--done' : ''}`}>
                      {label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="op-station-pill">
            <div className="op-station-pill__icon">{station.emoji || '💧'}</div>
            <div>
              <div className="op-station-pill__name">{station.name}</div>
              <div className="op-station-pill__meta">
                {station.distance && station.distance !== '—' && <span>📍 {station.distance}</span>}
                {station.eta      && station.eta      !== '—' && <span>⏱ {station.eta}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="op-content">

          {/* ── Step 1: Configure ── */}
          {step === 1 && <>
            <div className="op-content__section-title">Your Order Details</div>

            {errors.server && <div className="op-error-banner">⚠️ {errors.server}</div>}

            <div className="op-field">
              <label className="op-label">Water Type</label>
              <div className="op-type-pills">
                {station.waterTypes.map(t => (
                  <button key={t}
                    className={`op-type-pill${type === t ? ' op-type-pill--on' : ''}`}
                    onClick={() => setType(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="op-field">
              <label className="op-label">Number of Gallons</label>
              <div className="op-qty">
                <button className="op-qty__btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="op-qty__val">{qty}</span>
                <button className="op-qty__btn" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              {errors.qty
                ? <p className="op-err">{errors.qty}</p>
                : <p className="op-hint">Minimum 1 gallon per order</p>}
            </div>

            <div className="op-field">
              <label className="op-label">Delivery Address</label>
              <input className={`op-input${errors.address ? ' op-input--err' : ''}`}
                value={address}
                onChange={e => { setAddress(e.target.value); if (errors.address) setErrors(p => ({...p, address: null})) }}
                placeholder="Enter your full delivery address" />
              {errors.address && <p className="op-err">{errors.address}</p>}
            </div>

            <div className="op-field">
              <label className="op-label">
                Delivery Note <span className="op-label__opt">optional</span>
              </label>
              <textarea className={`op-input op-textarea${errors.note ? ' op-input--err' : ''}`}
                placeholder="e.g. Leave at the gate, call on arrival…"
                rows={3} maxLength={1000} value={noteText}
                onChange={e => { setNoteText(e.target.value); if (errors.note) setErrors(p => ({...p, note: null})) }} />
              <p className={`op-chars${noteText.length > 900 ? ' op-chars--warn' : ''}`}>{noteText.length} / 1000</p>
              {errors.note && <p className="op-err">{errors.note}</p>}
            </div>

            <div className="op-footer">
              <div className="op-footer__summary">
                <div className="op-footer__total-label">Order Total</div>
                <div className="op-footer__total-val">{fmt(total)}</div>
              </div>
              <div className="op-footer__actions">
                <div className="op-footer__rows">
                  <div className="op-footer__row">
                    <span>{qty} gal × {fmt(station.pricePerGallon)}</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  {station.deliveryFee > 0 && (
                    <div className="op-footer__row">
                      <span>Delivery fee</span>
                      <span>{fmt(station.deliveryFee)}</span>
                    </div>
                  )}
                </div>
                <button className="op-btn-primary" onClick={handleReview}>Next →</button>
              </div>
            </div>
          </>}

          {/* ── Step 2: Review ── */}
          {step === 2 && <>
            <div className="op-content__section-title">Review Your Order</div>

            <div className="op-review-rows">
              <div className="op-review-group">
                <div className="op-review-group__title">Order Info</div>
                {[
                  ['Station',    station.name],
                  ['Water Type', type],
                  ['Quantity',   `${qty} gallon${qty > 1 ? 's' : ''}`],
                  ['Total',      fmt(total)],
                  ...(station.eta && station.eta !== '—' ? [['ETA', station.eta]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="op-review-row">
                    <span>{label}</span><strong>{val}</strong>
                  </div>
                ))}
              </div>
              <div className="op-review-group">
                <div className="op-review-group__title">Delivery</div>
                <div className="op-review-row">
                  <span>Address</span><strong>{address}</strong>
                </div>
                {noteText.trim() && (
                  <div className="op-review-row op-review-row--note">
                    <span>📝 Note</span><strong>"{noteText}"</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="op-footer">
              <div className="op-footer__summary">
                <div className="op-footer__total-label">Total</div>
                <div className="op-footer__total-val">{fmt(total)}</div>
              </div>
              <div className="op-footer__actions">
                <button className="op-btn-ghost"   onClick={() => setStep(1)}>← Edit</button>
                <button className="op-btn-primary" onClick={handleConfirm} disabled={loading}>
                  {loading ? 'Placing…' : 'Confirm Order ✓'}
                </button>
              </div>
            </div>
          </>}

        </div>
      </div>
    </div>
  )
}