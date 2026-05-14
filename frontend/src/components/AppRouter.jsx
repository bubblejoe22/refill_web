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
import ActivatePage   from '../pages/ActivatePage'

import AppShell from '../components/AppShell'

export default function AppRouter() {

  const { user } = useAuth()

  const getInitialPage = () => {
    const path = window.location.pathname
    const match = path.match(/^\/activate\/([^/]+)\/([^/]+)$/)
    if (match) return 'activate'
    return user ? (user.is_staff ? 'admin' : 'home') : 'welcome'
  }

  const getInitialProps = () => {
    const path = window.location.pathname
    const match = path.match(/^\/activate\/([^/]+)\/([^/]+)$/)
    if (match) return { uid: match[1], token: match[2] }
    return {}
  }

  const [page, setPage] = useState(getInitialPage)
  const [pageProps, setPageProps] = useState(getInitialProps)

  const navigate = (to, props = {}) => {

    if (to === 'admin' && !user?.is_staff) {
      setPage('home')
      setPageProps({})
      return
    }

    if (user?.is_staff && ['home', 'browse', 'history', 'profile', 'track'].includes(to)) {
      setPage('admin')
      setPageProps({})
      return
    }
    setPageProps(props)
    setPage(to)
  }

  if (page === 'activate') {
    return <ActivatePage uid={pageProps.uid} token={pageProps.token} navigate={navigate} />
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
        {page === 'admin'   && user.is_staff  && <AdminPage   navigate={navigate} />}
      </AppShell>
    )
  }

  if (page === 'order')    return <OrderPage    navigate={navigate} {...pageProps} />
  if (page === 'schedule') return <SchedulePage navigate={navigate} {...pageProps} />

  return user.is_staff ? <AdminPage navigate={navigate} /> : <HomePage navigate={navigate} />
}