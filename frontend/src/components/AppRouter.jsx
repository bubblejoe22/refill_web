// COMPLIANCE (Lab 4 - Task 3): Client-side routing with distinct system screens (Login, Home, Track)
// COMPLIANCE (PIT - Gap 3): RBAC route guard — 'admin' page only accessible to staff users

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import WelcomePage    from '../pages/WelcomePage'
import LoginPage      from '../pages/LoginPage'
import RegisterPage   from '../pages/RegisterPage'
import HomePage       from '../pages/HomePage'
import BrowsePage     from '../pages/BrowsePage'
import OrderPage      from '../pages/OrderPage'
import SchedulePage   from '../pages/SchedulePage'
import HistoryPage    from '../pages/HistoryPage'
import TrackPage      from '../pages/TrackPage'
import ProfilePage    from '../delivered/ProfilePage'
import AdminPage      from '../pages/AdminPage'

import AppShell from '../components/AppShell'

export default function AppRouter() {
  // COMPLIANCE (Lab 4 - Task 1): Using Global State (user) to drive the main navigation logic
  const { user } = useAuth()
  // COMPLIANCE (PIT - Gap 3): Staff users land on admin, regular users land on home
  const [page, setPage] = useState(user ? (user.is_staff ? 'admin' : 'home') : 'welcome')
  const [pageProps, setPageProps] = useState({})

  const navigate = (to, props = {}) => {
    // COMPLIANCE (PIT - Gap 3): RBAC guard — redirect non-staff away from admin
    if (to === 'admin' && !user?.is_staff) {
      setPage('home')
      setPageProps({})
      return
    }
    // COMPLIANCE (PIT - Gap 3): RBAC guard — redirect staff away from customer pages
    if (user?.is_staff && ['home', 'browse', 'history', 'profile', 'track'].includes(to)) {
      setPage('admin')
      setPageProps({})
      return
    }
    setPageProps(props)
    setPage(to)
  }

  if (!user) {
    if (page === 'login')    return <LoginPage    navigate={navigate} />
    if (page === 'register') return <RegisterPage navigate={navigate} />
    return <WelcomePage navigate={navigate} />
  }

  const SHELL_PAGES = ['home', 'browse', 'history', 'profile', 'track', 'admin']

  if (SHELL_PAGES.includes(page)) {
    return (
      <AppShell page={page} navigate={navigate}>
        {page === 'home'    && !user.is_staff && <HomePage    navigate={navigate} />}
        {page === 'browse'  && !user.is_staff && <BrowsePage  navigate={navigate} {...pageProps} />}
        {page === 'history' && !user.is_staff && <HistoryPage navigate={navigate} />}
        {page === 'profile' && !user.is_staff && <ProfilePage navigate={navigate} />}
        {page === 'track'   && !user.is_staff && <TrackPage   navigate={navigate} {...pageProps} />}
        {/* COMPLIANCE (PIT - Gap 3): Admin page — only rendered if user.is_staff is true */}
        {page === 'admin'   && user.is_staff  && <AdminPage   navigate={navigate} />}
      </AppShell>
    )
  }

  if (page === 'order')    return <OrderPage    navigate={navigate} {...pageProps} />
  if (page === 'schedule') return <SchedulePage navigate={navigate} {...pageProps} />

  return user.is_staff ? <AdminPage navigate={navigate} /> : <HomePage navigate={navigate} />
}