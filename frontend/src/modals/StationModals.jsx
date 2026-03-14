import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import "./StationModalsStyle.css"

const reviewsAPI = {
  getAll: (stationId)                 => apiClient.get(`/products/stations/${stationId}/reviews/`),
  create: (stationId, data)           => apiClient.post(`/products/stations/${stationId}/reviews/`, data),
  update: (stationId, reviewId, data) => apiClient.patch(`/products/stations/${stationId}/reviews/${reviewId}/`, data),
  delete: (stationId, reviewId)       => apiClient.delete(`/products/stations/${stationId}/reviews/${reviewId}/`),
}

function Stars({ value = 0, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value
  return (
    <div className="stars-row">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star ${n <= active ? 'filled' : ''} ${interactive ? 'star-interactive' : ''}`}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onChange?.(n)}
        >★</span>
      ))}
    </div>
  )
}

export default function StationModal({ station, onClose, onOrder, onSchedule }) {
  const [reviews,      setReviews]      = useState([])
  const [loadingRevs,  setLoadingRevs]  = useState(false)
  const [newRating,    setNewRating]    = useState(0)
  const [newComment,   setNewComment]   = useState('')
  const [addErrors,    setAddErrors]    = useState({})
  const [addBusy,      setAddBusy]      = useState(false)
  const [editId,       setEditId]       = useState(null)
  const [editRating,   setEditRating]   = useState(0)
  const [editComment,  setEditComment]  = useState('')
  const [editErrors,   setEditErrors]   = useState({})
  const [editBusy,     setEditBusy]     = useState(false)

  useEffect(() => {
    if (!station?.id) return
    setLoadingRevs(true)
    reviewsAPI.getAll(station.id)
      .then(r => setReviews(Array.isArray(r.data) ? r.data : r.data?.results || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingRevs(false))
  }, [station?.id])

  const onBackdrop = (e) => { if (e.target === e.currentTarget) onClose() }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : station.rating

  const validate = (rating, comment, setErr) => {
    const e = {}
    if (!rating || rating < 1)    e.rating  = 'Please pick a star rating.'
    if (comment.length > 500)     e.comment = 'Comment cannot exceed 500 characters.'
    setErr(e)
    return Object.keys(e).length === 0
  }
  const handleAdd = async () => {
    if (!validate(newRating, newComment, setAddErrors)) return
    setAddBusy(true)
    try {
      const r = await reviewsAPI.create(station.id, { rating: newRating, comment: newComment.trim() })
      setReviews(prev => [r.data, ...prev])
      setNewRating(0); setNewComment(''); setAddErrors({})
    } catch (err) {
      const d = err.response?.data || {}
      setAddErrors({ server: d.detail || d.non_field_errors?.[0] || 'Could not submit review.' })
    } finally { setAddBusy(false) }
  }

  const handleSaveEdit = async () => {
    if (!validate(editRating, editComment, setEditErrors)) return
    setEditBusy(true)
    try {
      const r = await reviewsAPI.update(station.id, editId, { rating: editRating, comment: editComment.trim() })
      setReviews(prev => prev.map(rv => rv.id === editId ? r.data : rv))
      setEditId(null); setEditErrors({})
    } catch (err) {
      const d = err.response?.data || {}
      setEditErrors({ server: d.detail || 'Could not update review.' })
    } finally { setEditBusy(false) }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return
    try {
      await reviewsAPI.delete(station.id, reviewId)
      setReviews(prev => prev.filter(rv => rv.id !== reviewId))
    } catch { alert('Could not delete review. Please try again.') }
  }

  return (
    <div className="modal-backdrop" onClick={onBackdrop}>
      <div className="station-modal">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="smodal-header">
          <div className="smodal-hero">
            <span className="smodal-emoji">{station.emoji}</span>
            <div className="smodal-title-block">
              <h2 className="smodal-name">{station.name}</h2>
              <div className="smodal-meta-row">
                <span className="smodal-dist">📍 {station.distance}</span>
                <span className={`smodal-open-badge ${station.open ? 'open' : 'closed'}`}>
                  {station.open ? '🟢 Open now' : '🔴 Closed'}
                </span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="smodal-body">

          {/* ── Rating summary ──────────────────────────────────── */}
          <div className="smodal-rating-block">
            <span className="smodal-avg-score">{avg}</span>
            <div>
              <Stars value={Math.round(avg)} />
              <span className="smodal-review-count">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* ── Info grid ───────────────────────────────────────── */}
          <div className="smodal-info-grid">
            <div className="smodal-info-item">
              <span className="smodal-info-label">💧 Water Types</span>
              <div className="smodal-types">
                {station.waterTypes.map(t => <span key={t} className="wtype">{t}</span>)}
              </div>
            </div>
            <div className="smodal-info-item">
              <span className="smodal-info-label">💰 Price / Gallon</span>
              <span className="smodal-info-val">₱{station.pricePerGallon}</span>
            </div>
            <div className="smodal-info-item">
              <span className="smodal-info-label">🚚 Delivery Fee</span>
              <span className="smodal-info-val">₱{station.deliveryFee}</span>
            </div>
            <div className="smodal-info-item">
              <span className="smodal-info-label">⏱ ETA</span>
              <span className="smodal-info-val">{station.eta}</span>
            </div>
            <div className="smodal-info-item">
              <span className="smodal-info-label">📍 Location</span>
              <span className="smodal-info-val">Carmen, Cagayan de Oro City</span>
            </div>
            <div className="smodal-info-item">
              <span className="smodal-info-label">🕐 Hours</span>
              <span className="smodal-info-val">6:00 AM – 9:00 PM daily</span>
            </div>
          </div>

          {/* ── CTA buttons ─────────────────────────────────────── */}
          <div className="smodal-actions">
            <button
              className="btn-primary smodal-order-btn"
              disabled={!station.open}
              onClick={() => onOrder(station)}
            >
              🛒 Order Now
            </button>
            <button
              className="btn-ghost smodal-schedule-btn"
              onClick={() => onSchedule(station)}
            >
              📅 Schedule
            </button>
          </div>

          <div className="smodal-reviews-section">
            <h3 className="smodal-reviews-title">Customer Reviews</h3>

            {/* CRUD: READ */}
            {loadingRevs ? (
              <p className="reviews-loading">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="reviews-empty">No reviews yet. Be the first to rate this station!</p>
            ) : (
              <div className="reviews-list">
                {reviews.map(rv => (
                  <div key={rv.id} className="review-item">

                    {/* CRUD: UPDATE — inline edit mode */}
                    {editId === rv.id ? (
                      <div className="review-edit-mode">
                        <label className="form-label">Your Rating</label>
                        <Stars value={editRating} interactive onChange={v => { setEditRating(v); setEditErrors(p => ({...p, rating: null})) }} />
                        {editErrors.rating && <p className="field-error">{editErrors.rating}</p>}
                        <textarea
                          className={`text-inp note-inp ${editErrors.comment ? 'inp-error' : ''}`}
                          rows={3} maxLength={500}
                          value={editComment}
                          onChange={e => { setEditComment(e.target.value); setEditErrors(p => ({...p, comment: null})) }}
                        />
                        <p className={`note-char-count ${editComment.length > 450 ? 'warn' : ''}`}>{editComment.length}/500</p>
                        {editErrors.comment && <p className="field-error">{editErrors.comment}</p>}
                        {editErrors.server  && <p className="field-error">{editErrors.server}</p>}
                        <div className="note-edit-btns">
                          <button className="btn-ghost note-btn"
                            onClick={() => { setEditId(null); setEditErrors({}) }}>Cancel</button>
                          <button className="btn-primary note-btn"
                            onClick={handleSaveEdit} disabled={editBusy}>
                            {editBusy ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>

                    ) : (
                      /* Normal read view */
                      <div className="review-read-mode">
                        <div className="review-top">
                          <div className="review-author-block">
                            <div className="review-avatar">
                              {rv.author_username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="review-author">{rv.author_username || 'Anonymous'}</div>
                              <div className="review-date">
                                {rv.created_at
                                  ? new Date(rv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : ''}
                              </div>
                            </div>
                          </div>
                          <Stars value={rv.rating} />
                        </div>
                        {rv.comment && <p className="review-comment">"{rv.comment}"</p>}
                        {/* Edit / Delete only visible on own reviews */}
                        {rv.is_own && (
                          <div className="review-actions">
                            <button className="note-action-btn edit-btn"
                              onClick={() => {
                                setEditId(rv.id)
                                setEditRating(rv.rating)
                                setEditComment(rv.comment || '')
                                setEditErrors({})
                              }}>✏️ Edit</button>
                            <button className="note-action-btn delete-btn"
                              onClick={() => handleDelete(rv.id)}>🗑 Delete</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CRUD: CREATE — add review form */}
            <div className="review-add-form">
              <h4 className="review-form-title">Leave a Review</h4>

              <div className="form-section">
                <label className="form-label">Your Rating</label>
                <Stars
                  value={newRating}
                  interactive
                  onChange={v => { setNewRating(v); setAddErrors(p => ({...p, rating: null})) }}
                />
                {addErrors.rating && <p className="field-error">{addErrors.rating}</p>}
              </div>

              <div className="form-section">
                <label className="form-label">
                  Comment <span className="label-optional">(optional)</span>
                </label>
                <textarea
                  className={`text-inp note-inp ${addErrors.comment ? 'inp-error' : ''}`}
                  placeholder="Water quality? Delivery speed? Friendly driver?"
                  rows={3} maxLength={500}
                  value={newComment}
                  onChange={e => { setNewComment(e.target.value); setAddErrors(p => ({...p, comment: null})) }}
                />
                <p className={`note-char-count ${newComment.length > 450 ? 'warn' : ''}`}>
                  {newComment.length}/500
                </p>
                {addErrors.comment && <p className="field-error">{addErrors.comment}</p>}
                {addErrors.server  && <p className="field-error">{addErrors.server}</p>}
              </div>

              <button
                className="btn-primary full"
                onClick={handleAdd}
                disabled={addBusy || newRating === 0}
              >
                {addBusy ? 'Submitting…' : '⭐ Submit Review'}
              </button>
            </div>
          </div>
          {/* ══════════ END REVIEWS ══════════ */}

        </div>
      </div>
    </div>
  )
}