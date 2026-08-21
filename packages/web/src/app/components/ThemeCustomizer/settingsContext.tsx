


import { createContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { ThemePreset } from './types/theme'
import { defaultThemeState } from './config/theme'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getPresetThemeStyles } from './utils/theme-presets'

export type Mode = 'system' | 'light' | 'dark'

export type ThemeType = {
  preset?: string | null
  styles?: ThemePreset
}

export type ThemeSettings = {
  theme: ThemeType
  savedThemes?: Array<{
    name: string
    styles: ThemePreset
  }>
}

export type ModeSettings = {
  mode: Mode
}

export type Settings = ModeSettings & ThemeSettings

type SettingsContextProps = {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
  applyThemePreset: (preset: string) => void
  resetToDefault: () => void
  hasStateChanged: () => boolean
}

type Props = {
  children: ReactNode
}

// Defaults
const initialSettings: Settings = {
  mode: 'light',
  theme: {
    preset: null,
    styles: defaultThemeState
  },
  savedThemes: [],
}

export const SettingsContext = createContext<SettingsContextProps | null>(null)

export const SettingsProvider = ({ children }: Props) => {
  const [settings, setSettings] = useLocalStorage<Settings>('shivam-theme-settings', initialSettings)

  // Apply dark mode class to <html> & sync with project theme provider
  useEffect(() => {
    const root = document.documentElement
    if (settings.mode === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('vite-ui-theme', 'dark')
    } else if (settings.mode === 'light') {
      root.classList.remove('dark')
      localStorage.setItem('vite-ui-theme', 'light')
    }
  }, [settings.mode])

  // Inject CSS variables & Font Styles into DOM dynamically
  useEffect(() => {
    let styleElement = document.getElementById('shivam-dynamic-theme-styles') as HTMLStyleElement | null
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'shivam-dynamic-theme-styles'
      document.head.appendChild(styleElement)
    }

    const modeKey = settings.mode === 'dark' ? 'dark' : 'light'
    const modeStyles = settings.theme.styles?.[modeKey] || settings.theme.styles?.light

    if (modeStyles) {
      let cssRules = `:root {\n`
      Object.entries(modeStyles).forEach(([key, val]) => {
        if (key && val) {
          cssRules += `  --${key}: ${val};\n`
        }
      })
      cssRules += `}\n`

      // Apply font-sans to body, html, buttons, inputs and typography elements
      if (modeStyles['font-sans']) {
        cssRules += `*, body, html, button, input, select, textarea { font-family: ${modeStyles['font-sans']} !important; }\n`
      }

      styleElement.textContent = cssRules
    }
  }, [settings.theme.styles, settings.mode])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      theme: {
        ...prev.theme,
        ...newSettings.theme,
      },
      savedThemes: newSettings.savedThemes ?? prev.savedThemes,
    }))
  }

  const applyThemePreset = (preset: string) => {
    setSettings((prev) => ({
      ...prev,
      theme: {
        preset,
        styles: getPresetThemeStyles(preset),
      },
    }))
  }

  const resetToDefault = () => {
    setSettings({
      ...initialSettings,
      savedThemes: settings.savedThemes ?? [],
    })
  }

  const hasStateChanged = () => {
    return JSON.stringify(settings.theme.styles) !== JSON.stringify(initialSettings.theme.styles)
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        applyThemePreset,
        resetToDefault,
        hasStateChanged,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
