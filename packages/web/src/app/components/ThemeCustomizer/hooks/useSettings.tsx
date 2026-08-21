// React Imports
import { useContext } from 'react'
import { SettingsContext } from '../settingsContext'


export const useSettings = () => {
  // Hooks
  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider')
  }

  return context
}
