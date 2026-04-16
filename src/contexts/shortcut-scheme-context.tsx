import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  parseShortcutScheme,
  SHORTCUT_SCHEME_STORAGE_KEY,
  type ShortcutScheme,
} from "@/lib/shortcut-scheme"
import { shortcutSchemeRef } from "@/lib/shortcut-scheme-ref"

interface ShortcutSchemeContextValue {
  scheme: ShortcutScheme
  setScheme: (scheme: ShortcutScheme) => void
}

const ShortcutSchemeContext = createContext<ShortcutSchemeContextValue | null>(
  null,
)

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useShortcutScheme(): ShortcutSchemeContextValue {
  const ctx = useContext(ShortcutSchemeContext)
  if (!ctx) {
    throw new Error("useShortcutScheme must be used within ShortcutSchemeProvider")
  }
  return ctx
}

export function ShortcutSchemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ShortcutScheme>(() => {
    if (typeof localStorage === "undefined") return "google-docs"
    return parseShortcutScheme(
      localStorage.getItem(SHORTCUT_SCHEME_STORAGE_KEY),
    )
  })

  useEffect(() => {
    shortcutSchemeRef.current = scheme
  }, [scheme])

  const setScheme = useCallback((next: ShortcutScheme) => {
    localStorage.setItem(SHORTCUT_SCHEME_STORAGE_KEY, next)
    setSchemeState(next)
  }, [])

  const value = useMemo(
    () => ({
      scheme,
      setScheme,
    }),
    [scheme, setScheme],
  )

  return (
    <ShortcutSchemeContext.Provider value={value}>
      {children}
    </ShortcutSchemeContext.Provider>
  )
}
