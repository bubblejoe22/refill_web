import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../context/OrdersContext'
import { productsAPI } from '../api/products'
import { FaShoppingCart, FaCalendarAlt, FaHistory, FaTint, FaStar, FaMapMarkerAlt } from 'react-icons/fa'
import StationModal from '../modals/StationModals'

const fmt = (n) => `₱${Number(n).toLocaleString()}`
const toStation = (product) => ({
  id:             product.id,
  name:           product.name,
  description:    product.description || '',
  waterTypes:     product.category ? [product.category] : [],
  pricePerGallon: parseFloat(product.price ?? 0),
  deliveryFee:    0,     
  eta:            '—',       
  distance:       '—',    
  rating:         null,   
  stock:          product.stock ?? 0,
  open:           product.is_active ?? true,
})

export default function HomePage({ navigate }) {
  const { user } = useAuth()
  const { orders } = useOrders()

  const [stations, setStations]               = useState([])
  const [loadingStations, setLoading]         = useState(true)
  const [stationsError, setStationsError]     = useState(null)
  const [selectedStation, setSelectedStation] = useState(null)

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true)
      setStationsError(null)
      try {
        const res  = await productsAPI.getAll({ is_active: true })
        const data = res.data
        const list = Array.isArray(data) ? data : (data.results ?? [])
        setStations(list.map(toStation))
      } catch (err) {
        console.error('Failed to load stations:', err)
        setStationsError('Could not load stations. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchStations()
  }, [])

  const recentOrders = orders.slice(0, 3)

  return (
    <>
      <div className="dashboard">
        <main className="main">

          {/* TOPBAR */}
          <div className="topbar">
            <h2>Hello, {user?.username} 👋</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaMapMarkerAlt /> Carmen, Cagayan de Oro
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="quick-grid">
            <div className="quick-card" onClick={() => navigate('browse')}>
              <FaShoppingCart size={28} />
              <p>Refill Now</p>
            </div>
            <div className="quick-card" onClick={() => navigate('schedule')}>
              <FaCalendarAlt size={28} />
              <p>Schedule</p>
            </div>
            <div className="quick-card" onClick={() => navigate('history')}>
              <FaHistory size={28} />
              <p>History</p>
            </div>
          </div>

          {/* NEARBY STATIONS */}
          <div className="section">
            <h3>Nearby Stations</h3>

            {loadingStations && (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Loading stations…</p>
            )}

            {!loadingStations && stationsError && (
              <div className="op-error-banner">⚠️ {stationsError}</div>
            )}

            {!loadingStations && !stationsError && stations.length === 0 && (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>No stations available.</p>
            )}

            {!loadingStations && !stationsError && stations.length > 0 && (
              <div className="station-grid">
                {stations.map(station => (
                  <div key={station.id} className="station-card">

                    <div className="station-header">
                      <div className="station-left">
                        <div className="station-icon"><FaTint /></div>
                        <div>
                          <button
                            className="sc-name sc-name-link"
                            onClick={() => setSelectedStation(station)}
                          >
                            {station.name}
                          </button>
                          {station.distance !== '—' && (
                            <p className="station-distance">
                              <FaMapMarkerAlt /> {station.distance}
                            </p>
                          )}
                        </div>
                      </div>
                      {station.rating && (
                        <div className="station-rating">
                          <FaStar /> {station.rating}
                        </div>
                      )}
                    </div>

                    {/* Water type tags from category */}
                    {station.waterTypes.length > 0 && (
                      <div className="station-tags">
                        {station.waterTypes.map(t => <span key={t}>{t}</span>)}
                      </div>
                    )}

                    <div className="station-info">
                      <div>
                        <p>PER GALLON</p>
                        <h4>{fmt(station.pricePerGallon)}</h4>
                      </div>
                      <div>
                        <p>STOCK</p>
                        <h4>{station.stock} gal</h4>
                      </div>
                      {station.eta !== '—' && (
                        <div>
                          <p>ETA</p>
                          <h4>{station.eta}</h4>
                        </div>
                      )}
                    </div>

                    <div className="station-actions">
                      <button
                        className="order-btn"
                        onClick={() => setSelectedStation(station)}
                      >
                        <FaShoppingCart /> Order Now
                      </button>
                      <button
                        className="calendar-btn"
                        onClick={() => setSelectedStation(station)}
                      >
                        <FaCalendarAlt />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECENT ORDERS */}
          <div className="section">
            <h3>Recent Orders</h3>

            {recentOrders.length === 0 && (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>No recent orders yet.</p>
            )}

            {recentOrders.map(o => {
              const label = o.notes || o.shipping_address || 'Water Station'
              const qty   = Array.isArray(o.items)
                ? o.items.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0)
                : (o.qty || o.quantity || 0)
              const total = o.total_price || o.total || 0
              return (
                <div key={o.id} className="order-card">
                  <div>
                    <strong>{label}</strong>
                    <p>{qty} gal</p>
                  </div>
                  <div>
                    <span>{o.status}</span>
                    <p>{fmt(total)}</p>
                  </div>
                </div>
              )
            })}
          </div>

        </main>
      </div>

      {selectedStation && (
        <StationModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onOrder={s    => { setSelectedStation(null); navigate('order',    { station: s }) }}
          onSchedule={s => { setSelectedStation(null); navigate('schedule', { station: s }) }}
        />
      )}
    </>
  )
}