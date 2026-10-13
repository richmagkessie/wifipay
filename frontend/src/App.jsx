import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import PayPage   from './pages/PayPage'
import Routers   from './pages/Routers'
import Packages  from './pages/Packages'
import Vouchers  from './pages/Vouchers'
import Payments  from './pages/Payments'

function PrivateRoute({ children }) {
  return localStorage.getItem('access') ? children : <Navigate to="/login" replace />
}

function Private({ children }) {
  return <PrivateRoute>{children}</PrivateRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"                           element={<Login />} />
        <Route path="/pay"                             element={<PayPage />} />
        <Route path="/dashboard"                       element={<Private><Dashboard /></Private>} />
        <Route path="/routers"                         element={<Private><Routers /></Private>} />
        <Route path="/routers/:routerId/packages"      element={<Private><Packages /></Private>} />
        <Route path="/vouchers"                        element={<Private><Vouchers /></Private>} />
        <Route path="/payments"                        element={<Private><Payments /></Private>} />
        <Route path="/"                                element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
