import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminRoute } from './routes/AdminRoute'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { LandingPage } from './pages/public/LandingPage'
import { CatalogPage } from './pages/public/CatalogPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PanelDashboard } from './pages/panel/PanelDashboard'
import { MyCatalogPage } from './pages/panel/MyCatalogPage'
import { MyProfilePage } from './pages/panel/MyProfilePage'
import { MySalesPage } from './pages/panel/MySalesPage'
import { MyCommissionsPage } from './pages/panel/MyCommissionsPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminConfigPage } from './pages/admin/AdminConfigPage'
import { AdminLandingPage } from './pages/admin/AdminLandingPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminResellersPage } from './pages/admin/AdminResellersPage'
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
                <Route path="/catalogo" element={<CatalogPage />} />
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />

                {/* Revendedor autenticado */}
                <Route path="/panel"             element={<ProtectedRoute><PanelDashboard /></ProtectedRoute>} />
                <Route path="/panel/catalogo"    element={<ProtectedRoute><MyCatalogPage /></ProtectedRoute>} />
                <Route path="/panel/perfil"      element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
                <Route path="/panel/ventas"      element={<ProtectedRoute><MySalesPage /></ProtectedRoute>} />
                <Route path="/panel/comisiones"  element={<ProtectedRoute><MyCommissionsPage /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin"                element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/productos"      element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
                <Route path="/admin/configuracion"  element={<AdminRoute><AdminConfigPage /></AdminRoute>} />
                <Route path="/admin/landing"        element={<AdminRoute><AdminLandingPage /></AdminRoute>} />
                <Route path="/admin/pedidos"        element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
                <Route path="/admin/revendedores"   element={<AdminRoute><AdminResellersPage /></AdminRoute>} />

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
