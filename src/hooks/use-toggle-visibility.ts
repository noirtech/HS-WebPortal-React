import { useState, useEffect } from 'react'

export type DataSourceMode = 'mock' | 'database' | 'forced-mock' | 'forced-database'

export function useToggleVisibility() {
  const [showDataToggle, setShowDataToggle] = useState(true) // Default to true to show banner
  const [forcedMode, setForcedMode] = useState<'none' | 'mock' | 'database'>('none')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = () => {
      const savedShowDataToggle = localStorage.getItem('showDataToggle')
      const savedForcedMode = localStorage.getItem('forcedDataSourceMode')
      
      if (savedShowDataToggle !== null) {
        setShowDataToggle(JSON.parse(savedShowDataToggle))
      } else {
        // Default to true if no setting is saved
        setShowDataToggle(true)
        localStorage.setItem('showDataToggle', 'true')
      }
      
      if (savedForcedMode !== null) {
        setForcedMode(JSON.parse(savedForcedMode))
      }
      
      setIsLoading(false)
    }

    // Load settings on mount
    loadSettings()

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showDataToggle') {
        setShowDataToggle(e.newValue ? JSON.parse(e.newValue) : false)
      }
      if (e.key === 'forcedDataSourceMode') {
        setForcedMode(e.newValue ? JSON.parse(e.newValue) : 'none')
      }
    }

    // Listen for custom events from within the same tab
    const handleToggleVisibilityChange = (e: CustomEvent) => {
      setShowDataToggle(e.detail.showDataToggle)
    }

    const handleForcedModeChange = (e: CustomEvent) => {
      setForcedMode(e.detail.forcedMode)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('toggleVisibilityChanged', handleToggleVisibilityChange as EventListener)
    window.addEventListener('forcedModeChanged', handleForcedModeChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('toggleVisibilityChanged', handleToggleVisibilityChange as EventListener)
      window.removeEventListener('forcedModeChanged', handleForcedModeChange as EventListener)
    }
  }, [])

  const updateShowDataToggle = (enabled: boolean) => {
    setShowDataToggle(enabled)
    localStorage.setItem('showDataToggle', JSON.stringify(enabled))
    // Dispatch custom event to sync other components
    window.dispatchEvent(new CustomEvent('toggleVisibilityChanged', { 
      detail: { showDataToggle: enabled } 
    }))
  }

  const updateForcedMode = (mode: 'none' | 'mock' | 'database') => {
    setForcedMode(mode)
    localStorage.setItem('forcedDataSourceMode', JSON.stringify(mode))
    // Dispatch custom event to sync other components
    window.dispatchEvent(new CustomEvent('forcedModeChanged', { 
      detail: { forcedMode: mode } 
    }))
  }

  return { 
    showDataToggle, 
    updateShowDataToggle, 
    forcedMode,
    updateForcedMode,
    isLoading 
  }
}
