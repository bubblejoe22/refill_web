import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { ordersAPI } from '../api/orders'
import { productsAPI } from '../api/products'


const C = {
  deep:    '#133E87',
  mid:     '#608BC1',
  light:   '#CBDCEB',
  bg:      '#f0f7ff',
  surface: '#ffffff',
  border:  '#ddeaf7',
  text:    '#0d2240',
  muted:   '#64748b',
  success: '#059669',
  warning: '#d97706',
  danger:  '#dc2626',
}

const STATUS_COLOR = {
  delivered:  { bg: '#d1fae5', color: '#059669' },
  pending:    { bg: '#fef3c7', color: '#d97706' },
  processing: { bg: '#dbeafe', color: '#1d4ed8' },
  shipped:    { bg: '#ede9fe', color: '#7c3aed' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626' },
}
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const fmt        = (n)   => `₱${Number(n).toLocaleString()}`
const fmtDate    = (str) => new Date(str).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const getStatusStyle = (s) => STATUS_COLOR[s?.toLowerCase()] || { bg: '#f1f5f9', color: C.muted }


const Badge = ({ label, style }) => (
  <span style={{
    display: 'inline-block', fontSize: 11, fontWeight: 700,
    padding: '2px 9px', borderRadius: 20, fontFamily: 'var(--font)',
    textTransform: 'capitalize', ...style,
  }}>{label}</span>
)

const Toast = ({ toast }) => toast ? (
  <div style={{
    position: 'fixed', top: 20, right: 24, zIndex: 9999,
    background: toast.ok ? C.success : C.danger,
    color: '#fff', padding: '10px 20px', borderRadius: 10,
    fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
  }}>{toast.msg}</div>
) : null

const Spinner = ({ text = 'Loading…' }) => (
  <div style={{ textAlign: 'center', padding: 52, color: C.muted, fontSize: 14 }}>{text}</div>
)

const EmptyRow = ({ cols, text }) => (
  <tr><td colSpan={cols} style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>{text}</td></tr>
)

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{
      background: C.surface, borderRadius: 16, padding: '28px 32px',
      width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      maxHeight: '90vh', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font)', fontSize: 17, fontWeight: 800, color: C.text }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: C.muted, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
)

const Field = ({ label, children }) => (
  <div className="field">
    <label className="form-label">{label}</label>
    {children}
  </div>
)


function OrdersTab({ showToast }) {
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [userFilter,   setUserFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortRecent,   setSortRecent]   = useState(true)
  const [updating,     setUpdating]     = useState({})
  const [expanded,     setExpanded]     = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const res  = await ordersAPI.getAll(params)
      const data = res.data
      setOrders(Array.isArray(data) ? data : (data.results ?? []))
    } catch { setError('Failed to load orders.') }
    finally  { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const userList = [...new Set(orders.map(o => o.user?.username ?? `User #${o.user}`))].sort()

  const visible = orders
    .filter(o => {
      const uname = o.user?.username ?? `User #${o.user}`
      if (userFilter !== 'all' && uname !== userFilter) return false
      return true
    })
    .sort((a, b) => {
      const da = new Date(a.created_at), db = new Date(b.created_at)
      return sortRecent ? db - da : da - db
    })

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(u => ({ ...u, [orderId]: true }))
    try {
      await ordersAPI.updateStatus(orderId, newStatus)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      showToast(`Order #${orderId} updated to "${newStatus}"`)
    } catch { showToast(`Failed to update Order #${orderId}`, false) }
    finally  { setUpdating(u => ({ ...u, [orderId]: false })) }
  }


  const counts = { all: orders.length }
  ORDER_STATUSES.forEach(s => { counts[s] = orders.filter(o => o.status === s).length })

  const summaryItems = [
    { key: 'all',        label: 'All',        bg: C.bg,        color: C.deep },
    { key: 'pending',    label: 'Pending',    bg: '#fef3c7',   color: '#d97706' },
    { key: 'processing', label: 'Processing', bg: '#dbeafe',   color: '#1d4ed8' },
    { key: 'shipped',    label: 'Shipped',    bg: '#ede9fe',   color: '#7c3aed' },
    { key: 'delivered',  label: 'Delivered',  bg: '#d1fae5',   color: '#059669' },
    { key: 'cancelled',  label: 'Cancelled',  bg: '#fee2e2',   color: '#dc2626' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {summaryItems.map(item => (
          <div key={item.key} onClick={() => setStatusFilter(item.key)}
            style={{
              flex: '1 1 72px', minWidth: 72,
              background: item.bg,
              border: `1.5px solid ${statusFilter === item.key ? item.color : item.color + '44'}`,
              borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              outline: statusFilter === item.key ? `2px solid ${item.color}` : 'none',
              transition: 'outline 0.12s',
            }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{counts[item.key] ?? 0}</div>
            <div style={{ fontSize: 11, color: item.color, fontWeight: 600, textTransform: 'capitalize' }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</label>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            style={{ padding: '7px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: C.text, background: '#fff', cursor: 'pointer' }}
          >
            <option value="all">All Users ({orders.length})</option>
            {userList.map(u => (
              <option key={u} value={u}>
                {u} ({orders.filter(o => (o.user?.username ?? `User #${o.user}`) === u).length})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setSortRecent(v => !v)}
          style={{ padding: '7px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: C.deep, background: C.bg, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {sortRecent ? '↓ Newest First' : '↑ Oldest First'}
        </button>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="btn-primary"
          style={{ marginLeft: 'auto', padding: '7px 16px', fontSize: 12 }}
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: C.danger, padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      <div className="orders-table-wrap">
        {loading ? <Spinner /> : (
          <table className="orders-table">
            <thead>
              <tr>
                {['Order', 'Customer', 'Items', 'Total', 'Date', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0
                ? <EmptyRow cols={7} text="No orders found." />
: visible.map(order => {
    const st  = getStatusStyle(order.status)
    const isX = expanded === order.id
    return (
      <React.Fragment key={order.id}>
        <tr style={{ background: isX ? C.bg : 'transparent' }}>
          <td style={{ padding: '13px 18px' }}>
            <span style={{ fontFamily: 'var(--font)', fontWeight: 800, color: C.deep }}>#{order.id}</span>
          </td>
          <td style={{ padding: '13px 18px' }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{order.user?.username ?? `User #${order.user}`}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{order.user_email || ''}</div>
          </td>
          <td style={{ padding: '13px 18px', fontSize: 13, color: C.muted }}>{order.items?.length ?? 0} item(s)</td>
          <td style={{ padding: '13px 18px', fontWeight: 700, fontSize: 13 }}>{fmt(order.total_price)}</td>
          <td style={{ padding: '13px 18px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{fmtDate(order.created_at)}</td>
          <td style={{ padding: '13px 18px' }}>
            {updating[order.id]
              ? <span style={{ fontSize: 12, color: C.muted }}>Saving…</span>
              : (
                <select
                  value={order.status}
                  onChange={e => handleStatusChange(order.id, e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${st.color}`, background: st.bg, color: st.color, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              )
            }
          </td>
          <td style={{ padding: '13px 18px' }}>
            <button
              onClick={() => setExpanded(isX ? null : order.id)}
              style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '4px 10px', fontSize: 12, color: C.muted, cursor: 'pointer' }}
            >
              {isX ? 'Hide' : 'Details'}
            </button>
          </td>
        </tr>

        {isX && (
          <tr>
            <td colSpan={7} style={{ padding: '0 18px 16px 18px', background: C.bg }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 12 }}>
                {/* Items */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>Order Items</div>
                  {(order.items ?? []).length === 0
                    ? <p style={{ color: C.muted, fontSize: 13 }}>No items.</p>
                    : order.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                          <span>{item.product?.name ?? 'Unknown'} × {item.quantity}</span>
                          <span style={{ fontWeight: 700 }}>{fmt(item.subtotal ?? item.price * item.quantity)}</span>
                        </div>
                      ))
                  }
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Shipping Address</div>
                    <p style={{ fontSize: 13, color: C.text }}>{order.shipping_address || '—'}</p>
                  </div>
                  {order.order_notes?.length > 0 && (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Notes</div>
                      {order.order_notes.map(n => (
                        <div key={n.id} style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                          <strong>{n.author_username}</strong> [{n.note_type}]: {n.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    )
  })
              }
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
        Showing {visible.length} of {orders.length} orders · Staff can update any order status
      </p>
    </div>
  )
}


const BLANK_FORM = {
  name: '', description: '', price: '', stock: '',
  delivery_fee: '', eta: '15–25 min', location: '', category: '', is_active: true,
}

function StationForm({ form, setForm, categories, saving, onSubmit, onCancel, submitLabel }) {
  const set = (k) => (e) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Station Name *">
        <input className="text-inp" value={form.name} onChange={set('name')} placeholder="e.g. AquaStation Carmen" />
      </Field>
      <Field label="Description">
        <textarea className="text-inp" value={form.description} onChange={set('description')} rows={2} placeholder="Brief description…" style={{ resize: 'vertical' }} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Price per gallon (₱) *">
          <input className="text-inp" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" />
        </Field>
        <Field label="Stock (gallons) *">
          <input className="text-inp" type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="0" />
        </Field>
        <Field label="Delivery Fee (₱)">
          <input className="text-inp" type="number" min="0" step="0.01" value={form.delivery_fee} onChange={set('delivery_fee')} placeholder="0.00" />
        </Field>
        <Field label="ETA">
          <input className="text-inp" value={form.eta} onChange={set('eta')} placeholder="15–25 min" />
        </Field>
      </div>
      <Field label="Location / Address">
        <input className="text-inp" value={form.location} onChange={set('location')} placeholder="e.g. Carmen, CDO" />
      </Field>
      <Field label="Category">
        <select className="text-inp" value={form.category} onChange={set('category')}>
          <option value="">— None —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.text, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.is_active} onChange={set('is_active')} style={{ width: 16, height: 16 }} />
        Active (visible to customers)
      </label>
      <div className="modal-btns" style={{ marginTop: 8 }}>
        <button className="btn-primary" onClick={onSubmit} disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{ flex: 1, padding: '10px 0', border: `1.5px solid ${C.border}`, borderRadius: 10, background: '#fff', color: C.muted, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}


const STATION_STATUS = {
  active:   { label: 'Active',   bg: '#d1fae5', color: '#059669' },
  inactive: { label: 'Inactive', bg: '#fef3c7', color: '#d97706' },
  disabled: { label: 'Disabled', bg: '#fee2e2', color: '#dc2626' },
}

function StationsTab({ showToast }) {
  const [stations,   setStations]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showAll,    setShowAll]    = useState(true)
  const [modal,      setModal]      = useState(null)  
  const [form,       setForm]       = useState(BLANK_FORM)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [stRes, catRes] = await Promise.all([
        productsAPI.getAll(showAll ? {} : { is_active: true }),
        productsAPI.getCategories(),
      ])
      const stData  = stRes.data
      const catData = catRes.data
      setStations(Array.isArray(stData)  ? stData  : (stData.results  ?? []))
      setCategories(Array.isArray(catData) ? catData : (catData.results ?? []))
    } catch { showToast('Failed to load stations.', false) }
    finally  { setLoading(false) }
  }, [showAll])

  useEffect(() => { fetchAll() }, [fetchAll])

  const displayStatus = (s) => {
    if (!s.is_active) return 'disabled'
    if (s.stock === 0) return 'inactive'
    return 'active'
  }

  const openAdd = () => { setForm(BLANK_FORM); setModal('add') }
  const handleAdd = async () => {
    if (!form.name.trim() || !form.price || !form.stock) {
      showToast('Name, price, and stock are required.', false); return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price:        parseFloat(form.price),
        stock:        parseInt(form.stock),
        delivery_fee: parseFloat(form.delivery_fee || 0),
        category:     form.category || null,
      }
      const res = await productsAPI.create(payload)
      setStations(prev => [res.data, ...prev])
      setModal(null)
      showToast(`Station "${res.data.name}" added!`)
    } catch { showToast('Failed to add station.', false) }
    finally  { setSaving(false) }
  }

  const openEdit = (station) => {
    setForm({
      name:         station.name,
      description:  station.description  || '',
      price:        station.price,
      stock:        station.stock,
      delivery_fee: station.delivery_fee || '',
      eta:          station.eta          || '15–25 min',
      location:     station.location     || '',
      category:     station.category     || '',
      is_active:    station.is_active,
    })
    setModal({ edit: station })
  }
  const handleEdit = async () => {
    if (!form.name.trim()) { showToast('Station name is required.', false); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price:        parseFloat(form.price),
        stock:        parseInt(form.stock),
        delivery_fee: parseFloat(form.delivery_fee || 0),
        category:     form.category || null,
      }
      const res = await productsAPI.update(modal.edit.id, payload)
      setStations(prev => prev.map(s => s.id === modal.edit.id ? res.data : s))
      setModal(null)
      showToast(`Station "${res.data.name}" updated.`)
    } catch { showToast('Failed to update station.', false) }
    finally  { setSaving(false) }
  }

  const setStationStatus = async (station, newStatus) => {
    const patch =
      newStatus === 'disabled' ? { is_active: false } :
      newStatus === 'inactive' ? { is_active: true, stock: 0 } :
                                 { is_active: true, stock: station.stock > 0 ? station.stock : 10 }
    try {
      const res = await productsAPI.update(station.id, patch)
      setStations(prev => prev.map(s => s.id === station.id ? res.data : s))
      showToast(`"${station.name}" set to ${newStatus}.`)
    } catch { showToast('Failed to change status.', false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await productsAPI.delete(modal.delete.id)
      setStations(prev => prev.filter(s => s.id !== modal.delete.id))
      setModal(null)
      showToast(`Station "${modal.delete.name}" deleted.`)
    } catch { showToast('Failed to delete station.', false) }
    finally  { setDeleting(false) }
  }

  const countBy = (status) => stations.filter(s => displayStatus(s) === status).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Active',   count: countBy('active'),   color: '#059669', bg: '#d1fae5' },
            { label: 'Inactive', count: countBy('inactive'), color: '#d97706', bg: '#fef3c7' },
            { label: 'Disabled', count: countBy('disabled'), color: '#dc2626', bg: '#fee2e2' },
          ].map(chip => (
            <div key={chip.label} style={{ background: chip.bg, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: chip.color }}>
              {chip.count} {chip.label}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowAll(v => !v)}
            style={{ padding: '8px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: C.muted, background: C.bg, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {showAll ? 'Showing All' : 'Active Only'}
          </button>
          <button
            onClick={fetchAll}
            disabled={loading}
            style={{ padding: '8px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: C.muted, background: C.bg, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ↻ Refresh
          </button>
          <button className="btn-primary" onClick={openAdd} style={{ padding: '8px 18px', fontSize: 13 }}>
            + Add Station
          </button>
        </div>
      </div>
      <div className="orders-table-wrap">
        {loading ? <Spinner /> : (
          <table className="orders-table">
            <thead>
              <tr>
                {['Station', 'Category', 'Price', 'Stock', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stations.length === 0
                ? <EmptyRow cols={7} text="No stations found." />
                : stations.map(station => {
                    const ds  = displayStatus(station)
                    const dsc = STATION_STATUS[ds]
                    return (
                      <tr key={station.id}>
                        <td style={{ padding: '13px 18px' }}>
                          <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13, color: C.text }}>{station.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {station.description || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 13, color: C.muted }}>{station.category_name || '—'}</td>
                        <td style={{ padding: '13px 18px', fontWeight: 700, fontSize: 13 }}>{fmt(station.price)}</td>
                        <td style={{ padding: '13px 18px', fontSize: 13 }}>
                          <span style={{ fontWeight: 700, color: station.stock === 0 ? C.danger : C.success }}>{station.stock}</span>
                          <span style={{ color: C.muted, fontSize: 11 }}> gal</span>
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 12, color: C.muted }}>{station.location || '—'}</td>
                        <td style={{ padding: '13px 18px' }}>
                          <Badge label={dsc.label} style={{ background: dsc.bg, color: dsc.color }} />
                        </td>
                        <td style={{ padding: '13px 18px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {/* Edit */}
                            <button
                              onClick={() => openEdit(station)}
                              style={{ padding: '4px 10px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 12, background: '#fff', color: C.deep, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                            >
                              ✏ Edit
                            </button>

                          
                            {ds !== 'active' && (
                              <button
                                onClick={() => setStationStatus(station, 'active')}
                                style={{ padding: '4px 10px', border: '1.5px solid #059669', borderRadius: 7, fontSize: 12, background: '#d1fae5', color: '#059669', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                              >
                                ✓ Activate
                              </button>
                            )}
                            {ds !== 'inactive' && (
                              <button
                                onClick={() => setStationStatus(station, 'inactive')}
                                style={{ padding: '4px 10px', border: '1.5px solid #d97706', borderRadius: 7, fontSize: 12, background: '#fef3c7', color: '#d97706', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                              >
                                ⊘ Inactive
                              </button>
                            )}
                            {ds !== 'disabled' && (
                              <button
                                onClick={() => setStationStatus(station, 'disabled')}
                                style={{ padding: '4px 10px', border: '1.5px solid #dc2626', borderRadius: 7, fontSize: 12, background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                              >
                                ✕ Disable
                              </button>
                            )}

                           
                            <button
                              onClick={() => setModal({ delete: station })}
                              style={{ padding: '4px 10px', border: `1.5px solid ${C.danger}`, borderRadius: 7, fontSize: 12, background: '#fff', color: C.danger, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
        Status changes apply immediately · Disable hides station from customers
      </p>

     
      {modal === 'add' && (
        <Modal title="➕ Add New Station" onClose={() => setModal(null)}>
          <StationForm
            form={form} setForm={setForm} categories={categories}
            saving={saving} onSubmit={handleAdd} onCancel={() => setModal(null)}
            submitLabel="Add Station"
          />
        </Modal>
      )}

      
      {modal?.edit && (
        <Modal title={`✏ Edit — ${modal.edit.name}`} onClose={() => setModal(null)}>
          <StationForm
            form={form} setForm={setForm} categories={categories}
            saving={saving} onSubmit={handleEdit} onCancel={() => setModal(null)}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      
      {modal?.delete && (
        <Modal title="🗑 Delete Station" onClose={() => setModal(null)}>
          <p style={{ fontSize: 14, color: C.text, marginBottom: 20, lineHeight: 1.6 }}>
            Are you sure you want to permanently delete <strong>"{modal.delete.name}"</strong>?
            This cannot be undone and will affect all linked order items.
          </p>
          <div className="modal-btns">
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, background: C.danger, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {deleting ? 'Deleting…' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setModal(null)}
              disabled={deleting}
              style={{ flex: 1, padding: '10px 0', border: `1.5px solid ${C.border}`, borderRadius: 10, background: '#fff', color: C.muted, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const [tab,   setTab]   = useState('orders')
  const [toast, setToast] = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2800)
  }

  const tabs = [
    { id: 'orders',   label: '📋 Orders'  },
    { id: 'stations', label: '💧 Stations' },
  ]

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <Toast toast={toast} />

     
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
          🛡️ Admin Dashboard
        </h2>
        <p style={{ fontSize: 13, color: C.muted }}>
          Logged in as <strong>{user?.username}</strong> (Staff)
        </p>
      </div>

     
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${C.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 22px', border: 'none', background: 'none',
              fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: tab === t.id ? C.deep : C.muted,
              borderBottom: tab === t.id ? `3px solid ${C.deep}` : '3px solid transparent',
              marginBottom: -2, transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

     
      {tab === 'orders'   && <OrdersTab   showToast={showToast} />}
      {tab === 'stations' && <StationsTab showToast={showToast} />}
    </div>
  )
}