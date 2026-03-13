import { useState, useEffect } from 'react'
import { productsAPI } from '../api/products'

import {
  FaTint,
  FaBolt,
  FaCircle,
  FaStar,
  FaMapMarkerAlt,
  FaShoppingCart,
  FaCalendarAlt,
  FaSearch
} from "react-icons/fa"


import { IoWater } from "react-icons/io5"
import { GiBubbles, GiMountains } from "react-icons/gi"

const fmt = (n) => `₱${Number(n).toLocaleString()}`
const WATER_TYPES = ['All', 'Purified', 'Alkaline', 'Mineral']

const SAMPLE_STATIONS = [
  { id: 1, name: 'AquaPure Station',    icon: <FaTint />, distance: '0.5 km', pricePerGallon: 25, deliveryFee: 20, eta: '15–20 min', rating: 4.8, waterTypes: ['Purified','Alkaline'], open: true  },
  { id: 2, name: 'Crystal Clear Water', icon: <IoWater />, distance: '1.2 km', pricePerGallon: 23, deliveryFee: 25, eta: '20–25 min', rating: 4.6, waterTypes: ['Purified','Mineral'],  open: true  },
  { id: 3, name: 'Blue Spring Refill',  icon: <GiBubbles />, distance: '2.0 km', pricePerGallon: 28, deliveryFee: 15, eta: '25–30 min', rating: 4.9, waterTypes: ['Alkaline','Mineral'],  open: false },
  { id: 4, name: 'H2O Express',         icon: <FaBolt />, distance: '2.5 km', pricePerGallon: 22, deliveryFee: 30, eta: '10–15 min', rating: 4.5, waterTypes: ['Purified'],           open: true  },
  { id: 5, name: 'Pure Drop Refill',    icon: <FaCircle />, distance: '3.1 km', pricePerGallon: 26, deliveryFee: 18, eta: '20–30 min', rating: 4.7, waterTypes: ['Alkaline'],           open: true  },
  { id: 6, name: 'Mountain Spring Co.', icon: <GiMountains />, distance: '3.8 km', pricePerGallon: 30, deliveryFee: 20, eta: '30–40 min', rating: 4.9, waterTypes: ['Mineral'],            open: true  },
]

function StationCard({ station, onOrder, onSchedule }) {
  return (
    <div className={`station-card ${!station.open ? 'closed' : ''}`}>
      <div className="sc-top">
        <div className="sc-left">
          <div className="sc-emoji">{station.icon}</div>
          <div>
            <div className="sc-name">{station.name}</div>
            <div className="sc-dist"><FaMapMarkerAlt/> {station.distance}</div>
          </div>
        </div>

        <div className="sc-right">
          <div className="sc-rating"><FaStar/> {station.rating}</div>
          {!station.open && <div className="sc-closed-tag">Closed</div>}
        </div>
      </div>

      <div className="sc-types">
        {station.waterTypes.map(t => <span key={t} className="wtype">{t}</span>)}
      </div>

      <div className="sc-info">
        <div className="sc-info-item">
          <div className="sci-label">Per Gallon</div>
          <div className="sci-val">{fmt(station.pricePerGallon)}</div>
        </div>

        <div className="sc-divider" />

        <div className="sc-info-item">
          <div className="sci-label">Delivery</div>
          <div className="sci-val">{fmt(station.deliveryFee)}</div>
        </div>

        <div className="sc-divider" />

        <div className="sc-info-item">
          <div className="sci-label">ETA</div>
          <div className="sci-val">{station.eta}</div>
        </div>
      </div>

      <div className="sc-btns">
        <button
          className="order-now-btn"
          disabled={!station.open}
          onClick={() => onOrder(station)}
        >
          {station.open ? (
            <>
              <FaShoppingCart/> Order Now
            </>
          ) : (
            'Closed'
          )}
        </button>

        {station.open && (
          <button
            className="schedule-icon-btn"
            onClick={() => onSchedule(station)}
            title="Schedule"
          >
            <FaCalendarAlt/>
          </button>
        )}
      </div>
    </div>
  )
}

export default function BrowsePage({ navigate }) {

  const [stations, setStations] = useState(SAMPLE_STATIONS)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('distance')

  const STATION_ICONS = [
    <FaTint />,
    <IoWater />,
    <GiBubbles />,
    <FaBolt />,
    <FaCircle />,
    <GiMountains />
  ]

  useEffect(() => {
    productsAPI.getAll().then(r => {

      const data = Array.isArray(r.data) ? r.data : r.data?.results || []

      if (data.length) {

        setStations(
          data.map((p, i) => ({
            id: p.id,
            name: p.name,
            icon: STATION_ICONS[i % 6],
            distance: `${(Math.random()*3+0.3).toFixed(1)} km`,
            pricePerGallon: parseFloat(p.price) || 25,
            deliveryFee: 20,
            eta: '15–25 min',
            rating: (4.4 + Math.random()*0.6).toFixed(1),
            waterTypes: p.category ? [p.category] : ['Purified'],
            open: p.is_active !== false,
          }))
        )

      }

    }).catch(() => {})
  }, [])

  const displayed = stations
    .filter(s => filter === 'All' || s.waterTypes.includes(filter))
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {

      if (sortBy === 'price') return a.pricePerGallon - b.pricePerGallon

      if (sortBy === 'rating') return b.rating - a.rating

      return parseFloat(a.distance) - parseFloat(b.distance)

    })

  return (
    <div>

      <div className="controls-bar">

        <div className="search-wrap">
          <span><FaSearch/></span>

          <input
            className="search-inp"
            placeholder="Search stations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-row">
          {WATER_TYPES.map(t => (
            <button
              key={t}
              className={`filter-chip ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          className="sort-sel"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="distance">Nearest first</option>
          <option value="price">Cheapest first</option>
          <option value="rating">Top rated</option>
        </select>

      </div>

      <div className="results-meta">
        {displayed.length} station{displayed.length !== 1 ? 's' : ''} found
      </div>

      {displayed.length === 0
        ? (
          <div className="empty">
            <span><FaTint/></span>
            <p>No stations match your filters</p>
          </div>
        )
        : (
          <div className="stations-grid">
            {displayed.map(s => (
              <StationCard
                key={s.id}
                station={s}
                onOrder={station => navigate('order', { station })}
                onSchedule={station => navigate('schedule', { station })}
              />
            ))}
          </div>
        )
      }

    </div>
  )
}