import { BrowserRouter, Routes, Route, useLocation } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminRoute, AdminOnlyRoute } from './routes/AdminRoute'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { LandingPage } from './pages/public/LandingPage'
import { StorePage } from './pages/public/StorePage'
import { TermsPage } from './pages/public/TermsPage'
import { PrivacyPolicyPage, ChangePolicyPage, WithdrawalRightPage } from './pages/public/LegalPages'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PanelDashboard } from './pages/panel/PanelDashboard'
import { MyCatalogPage } from './pages/panel/MyCatalogPage'
import { MyProfilePage } from './pages/panel/MyProfilePage'
import { MySalesPage } from './pages/panel/MySalesPage'
import { ConfigurarProductoPage } from './pages/panel/ConfigurarProductoPage'
import { CrearReservaPage } from './pages/panel/CrearReservaPage'
import { CoursesPage } from './pages/panel/CoursesPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminConfigPage } from './pages/admin/AdminConfigPage'
import { AdminLandingPage } from './pages/admin/AdminLandingPage'
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminResellersPage } from './pages/admin/AdminResellersPage'
import { AdminSubAdminsPage } from './pages/admin/AdminSubAdminsPage'
import { AdminPickupsPage } from './pages/admin/AdminPickupsPage'
import { AdminCyclesPage } from './pages/admin/AdminCyclesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PanelLayout } from './components/panel/PanelLayout'
import { AdminLayout } from './components/admin/AdminLayout'

// "/", "/tienda/:slug", "/panel/*" y "/admin/*" traen su propio header/sidebar — no duplicamos el global ahí.
const SELF_CONTAINED_ROUTES = ['/']

function hasOwnChrome(pathname: string): boolean {
  return SELF_CONTAINED_ROUTES.includes(pathname)
    || pathname.startsWith('/tienda/')
    || pathname.startsWith('/panel')
    || pathname.startsWith('/admin')
}

function LayoutNavbar() {
  const { pathname } = useLocation()
  if (hasOwnChrome(pathname)) return null
  return <Navbar />
}

// El panel de revendedora y el admin traen su propio sidebar, sin footer del sitio.
function LayoutFooter() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/tienda/') || pathname.startsWith('/panel') || pathname.startsWith('/admin')) return null
  return <Footer />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <LayoutNavbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Públicas */}
                <Route path="/"         element={<LandingPage />} />
                <Route path="/tienda/:slug" element={<StorePage />} />
                <Route path="/terminos" element={<TermsPage />} />
                <Route path="/privacidad" element={<PrivacyPolicyPage />} />
                <Route path="/politica-de-cambios" element={<ChangePolicyPage />} />
                <Route path="/derecho-de-arrepentimiento" element={<WithdrawalRightPage />} />
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />

                {/* Revendedor autenticado */}
                <Route element={<PanelLayout />}>
                  <Route path="/panel"             element={<ProtectedRoute><PanelDashboard /></ProtectedRoute>} />
                  <Route path="/panel/catalogo"    element={<ProtectedRoute><MyCatalogPage /></ProtectedRoute>} />
                  <Route path="/panel/catalogo/:id" element={<ProtectedRoute><ConfigurarProductoPage /></ProtectedRoute>} />
                  <Route path="/panel/reservar"    element={<ProtectedRoute><CrearReservaPage /></ProtectedRoute>} />
                  <Route path="/panel/cursos"      element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                  <Route path="/panel/perfil"      element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
                  <Route path="/panel/ventas"      element={<ProtectedRoute><MySalesPage /></ProtectedRoute>} />
                </Route>

                {/* Admin */}
                <Route element={<AdminLayout />}>
                  {/* accesibles por ADMIN y SUBADMIN */}
                  <Route path="/admin"               element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/productos"     element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
                  <Route path="/admin/retiros"       element={<AdminRoute><AdminPickupsPage /></AdminRoute>} />
                  <Route path="/admin/ciclos"        element={<AdminRoute><AdminCyclesPage /></AdminRoute>} />
                  <Route path="/admin/cursos"        element={<AdminRoute><AdminCoursesPage /></AdminRoute>} />

                  {/* solo ADMIN */}
                  <Route path="/admin/configuracion" element={<AdminOnlyRoute><AdminConfigPage /></AdminOnlyRoute>} />
                  <Route path="/admin/landing"       element={<AdminOnlyRoute><AdminLandingPage /></AdminOnlyRoute>} />
                  <Route path="/admin/pedidos"       element={<AdminOnlyRoute><AdminOrdersPage /></AdminOnlyRoute>} />
                  <Route path="/admin/revendedores"  element={<AdminOnlyRoute><AdminResellersPage /></AdminOnlyRoute>} />
                  <Route path="/admin/subadmins"     element={<AdminOnlyRoute><AdminSubAdminsPage /></AdminOnlyRoute>} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <LayoutFooter />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
