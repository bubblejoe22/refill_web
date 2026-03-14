import { useState, useEffect } from 'react'
import { useOrders } from '../context/OrdersContext'
import { productsAPI } from '../api/products'
import { ordersAPI } from '../api/orders'
import { FaTint, FaMapMarkerAlt, FaStar, FaCalendarAlt } from 'react-icons/fa'
import './order.css'

const fmt = (n) => `₱${Number(n).toLocaleString()}`

const FREQUENCIES = [
  { id: 'once',     label: 'One-time',  desc: 'Deliver once on selected date' },
  { id: 'weekly',   label: 'Weekly',    desc: 'Repeat every week' },
  { id: 'biweekly', label: 'Bi-weekly', desc: 'Every 2 weeks' },
  { id: 'monthly',  label: 'Monthly',   desc: 'Repeat every month' },
]

const SIDEBAR_STEPS = ['Frequency & Time', 'Quantity & Address', 'Note']

const toStation = (product) => ({
  id:             product.id,
  name:           product.name,
  description:    product.description || '',
  waterTypes:     product.category ? [product.category] : [],
  pricePerGallon: parseFloat(product.price ?? 0),
  deliveryFee:    0,
  eta:            null,
  distance:       null,
  rating:         null,
  stock:          product.stock ?? 0,
  open:           product.is_active ?? true,
})

export default function SchedulePage({ navigate, station: initialStation }) {
  const { createOrder } = useOrders()

  const [station,         setStation]         = useState(initialStation || null)
  const [stations,        setStations]        = useState([])
  const [loadingStations, setLoadingStations] = useState(!initialStation)
  const [stationsError,   setStationsError]   = useState(null)

  const [form, setForm] = useState({
    date: '', time: '08:00', qty: 1,
    type:      initialStation?.waterTypes?.[0] || 'Purified',
    address:   'Carmen, Cagayan de Oro City',
    frequency: 'once',
  })
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [noteText, setNoteText] = useState('')
  const [errors,   setErrors]   = useState({})

  useEffect(() => {
    if (initialStation) return
    const fetchStations = async () => {
      setLoadingStations(true); setStationsError(null)
      try {
        const res  = await productsAPI.getAll({ is_active: true })
        const data = res.data
        const list = Array.isArray(data) ? data : (data.results ?? [])
        setStations(list.map(toStation))
      } catch (err) {
        console.error('Failed to load stations:', err)
        setStationsError('Could not load stations. Please try again.')
      } finally { setLoadingStations(false) }
    }
    fetchStations()
  }, [initialStation])

  const handlePickStation = (s) => {
    setStation(s)
    setForm(f => ({ ...f, type: s.waterTypes?.[0] || 'Purified' }))
  }

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: null }))
  }

  const subtotal = form.qty * (station?.pricePerGallon || 0)
  const total    = subtotal + (station?.deliveryFee    || 0)
  const today    = new Date().toISOString().split('T')[0]

  const validate = () => {
    const e = {}
    if (!form.date)             e.date    = 'Please select a delivery date.'
    else if (form.date < today) e.date    = 'Delivery date cannot be in the past.'
    if (!form.time)             e.time    = 'Please select a delivery time.'
    if (form.qty < 1)           e.qty     = 'Quantity must be at least 1.'
    if (!form.address.trim())   e.address = 'Delivery address is required.'
    else if (form.address.trim().length < 10) e.address = 'Please enter a complete address (at least 10 chars).'
    if (noteText.length > 1000) e.note    = 'Note cannot exceed 1000 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSchedule = async () => {
    if (!validate()) return
    setLoading(true); setErrors({})

    const result = await createOrder({
      shipping_address: form.address,
      status:           'pending',
      notes: `SCHEDULED ${form.frequency.toUpperCase()} | ${form.date} ${form.time} | ${form.qty}x ${form.type}${station ? ` from ${station.name}` : ''}`,
    })

    if (!result.success) {
      const e = result.errors || {}
      setErrors({ server: e.shipping_address?.[0] || e.notes?.[0] || e.detail || 'Something went wrong.' })
      setLoading(false); return
    }

    const newOrderId = result.data.id

    try {
      await ordersAPI.items.create(newOrderId, {
        product_id: station.id,
        quantity:   form.qty,
        price:      station.pricePerGallon,
      })
    } catch (err) {
      console.warn('Item creation failed:', err.response?.data)
    }

    if (noteText.trim()) {
      try { await ordersAPI.notes.create(newOrderId, { content: noteText.trim(), note_type: 'customer' }) }
      catch { console.warn('Note save failed, scheduled order was placed.') }
    }

    setLoading(false); setDone(true)
  }

  const freqLabel = FREQUENCIES.find(f => f.id === form.frequency)?.label.toLowerCase()

  if (done) return (
    <div className="op-page">
      <div className="op-card">
        <div className="op-sidebar">
          <div className="op-sidebar__title">Schedule<br />Confirmed</div>
          {station && (
            <div className="op-station-pill">
              <div className="op-station-pill__icon">💧</div>
              <div>
                <div className="op-station-pill__name">{station.name}</div>
                <div className="op-station-pill__meta"><span>{freqLabel}</span></div>
              </div>
            </div>
          )}
        </div>
        <div className="op-content">
          <div className="op-success">
            <div className="op-success__orb">📅</div>
            <h2 className="op-success__title">Delivery Scheduled!</h2>
            <p className="op-success__sub">
              Your {freqLabel} delivery is set for<br />
              <strong>{form.date} at {form.time}</strong>
            </p>
            {noteText.trim() && <div className="op-success__note">📝 Note saved: <em>"{noteText}"</em></div>}
            <div className="op-success__actions">
              <button className="op-btn-primary" onClick={() => navigate('history')}>View Orders</button>
              <button className="op-btn-ghost"   onClick={() => navigate('home')}>Back to Home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!station) return (
    <div className="op-page">
      <div className="op-card">
        <div className="op-sidebar">
          <button className="op-sidebar__back" onClick={() => navigate('home')}>← Back to Home</button>
          <div className="op-sidebar__title">Schedule a<br />Delivery</div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginTop: '0.75rem', lineHeight: '1.5' }}>
            Pick a station below to begin scheduling your delivery.
          </p>
        </div>
        <div className="op-content">
          <div className="op-content__section-title">Select a Station</div>
          {loadingStations && <p style={{ color: '#888', fontSize: '0.9rem' }}>Loading stations…</p>}
          {!loadingStations && stationsError && <div className="op-error-banner">⚠️ {stationsError}</div>}
          {!loadingStations && !stationsError && stations.length === 0 && (
            <p style={{ color: '#888', fontSize: '0.9rem' }}>No stations available right now.</p>
          )}
          {!loadingStations && !stationsError && stations.length > 0 && (
            <div className="station-grid" style={{ marginTop: '0.5rem' }}>
              {stations.map(s => (
                <div key={s.id} className="station-card" style={{ cursor: 'pointer' }}
                  onClick={() => handlePickStation(s)}>
                  <div className="station-header">
                    <div className="station-left">
                      <div className="station-icon"><FaTint /></div>
                      <div>
                        <div className="sc-name">{s.name}</div>
                        {s.distance && <p className="station-distance"><FaMapMarkerAlt /> {s.distance}</p>}
                      </div>
                    </div>
                    {s.rating && <div className="station-rating"><FaStar /> {s.rating}</div>}
                  </div>
                  {s.waterTypes.length > 0 && (
                    <div className="station-tags">{s.waterTypes.map(t => <span key={t}>{t}</span>)}</div>
                  )}
                  <div className="station-info">
                    <div><p>PER GALLON</p><h4>{fmt(s.pricePerGallon)}</h4></div>
                    <div><p>STOCK</p><h4>{s.stock} gal</h4></div>
                  </div>
                  <div className="station-actions">
                    <button className="op-btn-primary" style={{ width: '100%' }}
                      onClick={(e) => { e.stopPropagation(); handlePickStation(s) }}>
                      <FaCalendarAlt style={{ marginRight: '6px' }} /> Schedule this Station
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="op-page">
      <div className="op-card">

        <div className="op-sidebar">
          <button className="op-sidebar__back"
            onClick={() => initialStation ? navigate('browse') : setStation(null)}>
            ← {initialStation ? 'Back to Browse' : 'Change Station'}
          </button>
          <div className="op-sidebar__title">Schedule a<br />Delivery</div>
          <div className="op-steps">
            {SIDEBAR_STEPS.map((label, i) => {
              const isLast = i === SIDEBAR_STEPS.length - 1
              return (
                <div key={label} className="op-step">
                  <div className="op-step__track">
                    <div className={`op-step__circle${i === 0 ? ' op-step--active' : ''}`}>{i + 1}</div>
                    {!isLast && <div className="op-step__line" />}
                  </div>
                  <div className="op-step__info">
                    <div className={`op-step__label${i === 0 ? ' op-step--active' : ''}`}>{label}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="op-station-pill">
            <div className="op-station-pill__icon">💧</div>
            <div>
              <div className="op-station-pill__name">{station.name}</div>
              <div className="op-station-pill__meta">
                {station.distance && <span>📍 {station.distance}</span>}
                {station.rating   && <span>⭐ {station.rating}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="op-content">
          <div className="op-content__section-title">Schedule Details</div>

          {errors.server && <div className="op-error-banner">⚠️ {errors.server}</div>}

          <div className="op-field">
            <label className="op-label">Frequency</label>
            <div className="op-freq-grid">
              {FREQUENCIES.map(f => (
                <button key={f.id}
                  className={`op-freq-btn${form.frequency === f.id ? ' op-freq-btn--on' : ''}`}
                  onClick={() => setForm(x => ({ ...x, frequency: f.id }))}>
                  <span className="op-freq-btn__label">{f.label}</span>
                  <span className="op-freq-btn__desc">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="op-row-2">
            <div className="op-field">
              <label className="op-label">Date</label>
              <input className={`op-input${errors.date ? ' op-input--err' : ''}`}
                type="date" min={today} value={form.date} onChange={set('date')} />
              {errors.date && <p className="op-err">{errors.date}</p>}
            </div>
            <div className="op-field">
              <label className="op-label">Time</label>
              <input className={`op-input${errors.time ? ' op-input--err' : ''}`}
                type="time" value={form.time} onChange={set('time')} />
              {errors.time && <p className="op-err">{errors.time}</p>}
            </div>
          </div>

          {station.waterTypes?.length > 0 && (
            <div className="op-field">
              <label className="op-label">Water Type</label>
              <div className="op-type-pills">
                {station.waterTypes.map(t => (
                  <button key={t}
                    className={`op-type-pill${form.type === t ? ' op-type-pill--on' : ''}`}
                    onClick={() => setForm(x => ({ ...x, type: t }))}>{t}</button>
                ))}
              </div>
            </div>
          )}

          <div className="op-field">
            <label className="op-label">Gallons</label>
            <div className="op-qty">
              <button className="op-qty__btn" onClick={() => setForm(x => ({ ...x, qty: Math.max(1, x.qty - 1) }))}>−</button>
              <span className="op-qty__val">{form.qty}</span>
              <button className="op-qty__btn" onClick={() => setForm(x => ({ ...x, qty: x.qty + 1 }))}>+</button>
            </div>
            {errors.qty && <p className="op-err">{errors.qty}</p>}
          </div>

          <div className="op-field">
            <label className="op-label">Delivery Address</label>
            <input className={`op-input${errors.address ? ' op-input--err' : ''}`}
              value={form.address} onChange={set('address')} />
            {errors.address && <p className="op-err">{errors.address}</p>}
          </div>

          <div className="op-field">
            <label className="op-label">
              Delivery Note <span className="op-label__opt">optional</span>
            </label>
            <textarea className={`op-input op-textarea${errors.note ? ' op-input--err' : ''}`}
              placeholder="e.g. Knock loudly, leave at door, call before arriving…"
              rows={2} maxLength={1000} value={noteText}
              onChange={e => { setNoteText(e.target.value); if (errors.note) setErrors(p => ({...p, note: null})) }} />
            <p className={`op-chars${noteText.length > 900 ? ' op-chars--warn' : ''}`}>{noteText.length} / 1000</p>
            {errors.note && <p className="op-err">{errors.note}</p>}
          </div>

          <div className="op-footer">
            <div className="op-footer__summary">
              <div className="op-footer__total-label">Per Delivery</div>
              <div className="op-footer__total-val">{fmt(total)}</div>
            </div>
            <div className="op-footer__actions">
              <div className="op-footer__rows">
                <div className="op-footer__row">
                  <span>{form.qty} gal × {fmt(station.pricePerGallon)}</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {station.deliveryFee > 0 && (
                  <div className="op-footer__row">
                    <span>Delivery fee</span>
                    <span>{fmt(station.deliveryFee)}</span>
                  </div>
                )}
              </div>
              <button className="op-btn-primary" onClick={handleSchedule} disabled={loading}>
                {loading ? 'Scheduling…' : '📅 Confirm Schedule'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}