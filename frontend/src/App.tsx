import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminRoute } from './routes/AdminRoute'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { LandingPage } from './pages/public/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PanelDashboard } from './pages/panel/PanelDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Públicas */}
                <Route path="/"         element={<LandingPage />} />
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />

                {/* Revendedor autenticado */}
                <Route
                  path="/panel"
                  element={<ProtectedRoute><PanelDashboard /></ProtectedRoute>}
                />

                {/* Admin */}
                <Route
                  path="/admin"
                  element={<AdminRoute><AdminDashboard /></AdminRoute>}
                />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
