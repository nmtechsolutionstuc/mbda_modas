import { Outlet } from 'react-router'
import { PanelSidebar } from './PanelSidebar'
import { useAuthStore } from '../../store/authStore'
import { isReseller } from '../../types'
import { themeCssVars } from '../../theme/storeThemes'

export function PanelLayout() {
  const { user } = useAuthStore()
  const theme = user && isReseller(user) ? user.storeTheme : 'ELEGANTE'

  return (
    <div style={{ ...themeCssVars(theme), display: 'flex', minHeight: '100vh' }}>
      <PanelSidebar />
      <div className="panel-content" style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  )
}
