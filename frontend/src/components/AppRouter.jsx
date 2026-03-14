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

import AppShell from '../components/AppShell'

export default function AppRouter() {
  const { user } = useAuth()
  const [page, setPage] = useState(user ? 'home' : 'welcome')
  const [pageProps, setPageProps] = useState({})

  const navigate = (to, props = {}) => {
    setPageProps(props)
    setPage(to)
  }

  if (!user) {
    if (page === 'login')    return <LoginPage    navigate={navigate} />
    if (page === 'register') return <RegisterPage navigate={navigate} />
    return <WelcomePage navigate={navigate} />
  }

  const SHELL_PAGES = ['home', 'browse', 'history', 'profile', 'track']

  if (SHELL_PAGES.includes(page)) {
    return (
      <AppShell page={page} navigate={navigate}>
        {page === 'home'    && <HomePage    navigate={navigate} />}
        {page === 'browse'  && <BrowsePage  navigate={navigate} {...pageProps} />}
        {page === 'history' && <HistoryPage navigate={navigate} />}
        {page === 'profile' && <ProfilePage navigate={navigate} />}
        {page === 'track'   && <TrackPage   navigate={navigate} {...pageProps} />}
      </AppShell>
    )
  }

  if (page === 'order')    return <OrderPage    navigate={navigate} {...pageProps} />
  if (page === 'schedule') return <SchedulePage navigate={navigate} {...pageProps} />

  return <HomePage navigate={navigate} />
}