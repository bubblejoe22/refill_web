import { useState, useEffect } from 'react'
import { productsAPI } from '../api/products'
import StationModal from '../modals/StationModals'

import {
  FaTint, FaBolt, FaCircle, FaStar,
  FaMapMarkerAlt, FaShoppingCart, FaCalendarAlt, FaSearch
} from "react-icons/fa"
import { IoWater } from "react-icons/io5"
import { GiBubbles, GiMountains } from "react-icons/gi"

const fmt = (n) => `₱${Number(n).toLocaleString()}`
const WATER_TYPES = ['All', 'Purified', 'Alkaline', 'Mineral']

const STATION_ICONS = [
  <FaTint />, <IoWater />, <GiBubbles />,
  <FaBolt />, <FaCircle />, <GiMountains />
]

function StationCard({ station, onOrder, onSchedule, onViewDetails }) {
  return (
    <div className={`station-card ${!station.open ? 'closed' : ''}`}>
      <div className="sc-top">
        <div className="sc-left">
          <div className="sc-emoji">{station.icon}</div>
          <div>
            <button className="sc-name sc-name-link" onClick={() => onViewDetails(station)}>
              {station.name}
            </button>
            {station.distance && station.distance !== '—' && (
              <div className="sc-dist"><FaMapMarkerAlt /> {station.distance}</div>
            )}
          </div>
        </div>
        <div className="sc-right">
          {station.rating && <div className="sc-rating"><FaStar /> {station.rating}</div>}
          {!station.open && <div className="sc-closed-tag">Closed</div>}
        </div>
      </div>

      {station.waterTypes.length > 0 && (
        <div className="sc-types">
          {station.waterTypes.map(t => <span key={t} className="wtype">{t}</span>)}
        </div>
      )}

      <div className="sc-info">
        <div className="sc-info-item">
          <div className="sci-label">Per Gallon</div>
          <div className="sci-val">{fmt(station.pricePerGallon)}</div>
        </div>
        <div className="sc-divider" />
        <div className="sc-info-item">
          <div className="sci-label">Delivery</div>
          {/* ✅ FIXED: reads real delivery_fee from DB */}
          <div className="sci-val">
            {station.deliveryFee > 0 ? fmt(station.deliveryFee) : 'Free'}
          </div>
        </div>
        <div className="sc-divider" />
        <div className="sc-info-item">
          <div className="sci-label">ETA</div>
          {/* ✅ FIXED: reads real eta from DB */}
          <div className="sci-val">{station.eta || '—'}</div>
        </div>
      </div>

      <div className="sc-btns">
        <button
          className="order-now-btn"
          disabled={!station.open}
          onClick={() => onOrder(station)}
        >
          {station.open ? <><FaShoppingCart /> Order Now</> : 'Closed'}
        </button>
        {station.open && (
          <button className="schedule-icon-btn" onClick={() => onSchedule(station)} title="Schedule">
            <FaCalendarAlt />
          </button>
        )}
      </div>
    </div>
  )
}

export default function BrowsePage({ navigate }) {
  // ✅ FIXED: was initialized with SAMPLE_STATIONS which was never defined — crashes on load
  const [stations,  setStations]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('All')
  const [search,    setSearch]    = useState('')
  const [sortBy,    setSortBy]    = useState('distance')
  const [selectedStation, setSelectedStation] = useState(null)

  useEffect(() => {
    setLoading(true)
    productsAPI.getAll().then(r => {
      const data = Array.isArray(r.data) ? r.data : (r.data?.results ?? [])
      setStations(
        data.map((p, i) => ({
          id:             p.id,
          name:           p.name,
          icon:           STATION_ICONS[i % STATION_ICONS.length],
          pricePerGallon: parseFloat(p.price) || 0,
          deliveryFee:    parseFloat(p.delivery_fee) || 0,  // ✅ real DB field
          eta:            p.eta || '—',                     // ✅ real DB field
          distance:       p.location || '—',                // ✅ real DB field (location)
          rating:         null,
          // ✅ FIXED: was p.category (ID number), now uses p.category_name (string)
          waterTypes:     p.category_name ? [p.category_name] : ['Purified'],
          open:           p.is_active !== false,
          emoji:          '💧',
        }))
      )
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const displayed = stations
    .filter(s => filter === 'All' || s.waterTypes.includes(filter))
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price')  return a.pricePerGallon - b.pricePerGallon
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      return parseFloat(a.distance) - parseFloat(b.distance)
    })

  return (
    <div>
      <div className="controls-bar">
        <div className="search-wrap">
          <span><FaSearch /></span>
          <input
            className="search-inp"
            placeholder="Search stations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-row">
          {WATER_TYPES.map(t => (
            <button key={t}
              className={`filter-chip ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>
        <select className="sort-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="distance">Nearest first</option>
          <option value="price">Cheapest first</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <div className="results-meta">
        {loading
          ? 'Loading stations…'
          : `${displayed.length} station${displayed.length !== 1 ? 's' : ''} found`}
      </div>

      {!loading && displayed.length === 0 && (
        <div className="empty">
          <span><FaTint /></span>
          <p>No stations match your filters</p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="stations-grid">
          {displayed.map(s => (
            <StationCard
              key={s.id}
              station={s}
              onOrder={station => navigate('order', { station })}
              onSchedule={station => navigate('schedule', { station })}
              onViewDetails={s => setSelectedStation(s)}
            />
          ))}
        </div>
      )}

      {selectedStation && (
        <StationModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onOrder={s => { setSelectedStation(null); navigate('order', { station: s }) }}
          onSchedule={s => { setSelectedStation(null); navigate('schedule', { station: s }) }}
        />
      )}
    </div>
  )
}