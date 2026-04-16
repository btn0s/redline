import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  DEFAULT_SPELLCHECK_ENABLED,
  parseSpellcheckEnabled,
  SPELLCHECK_STORAGE_KEY,
} from "@/lib/editor-settings"

interface EditorSettingsContextValue {
  spellcheckEnabled: boolean
  setSpellcheckEnabled: (enabled: boolean) => void
}

const EditorSettingsContext = createContext<EditorSettingsContextValue | null>(
  null,
)

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useEditorSettings(): EditorSettingsContextValue {
  const ctx = useContext(EditorSettingsContext)
  if (!ctx) {
    throw new Error(
      "useEditorSettings must be used within EditorSettingsProvider",
    )
  }
  return ctx
}

export function EditorSettingsProvider({ children }: { children: ReactNode }) {
  const [spellcheckEnabled, setSpellcheckEnabledState] = useState<boolean>(
    () => {
      if (typeof localStorage === "undefined") return DEFAULT_SPELLCHECK_ENABLED
      return parseSpellcheckEnabled(
        localStorage.getItem(SPELLCHECK_STORAGE_KEY),
      )
    },
  )

  const setSpellcheckEnabled = useCallback((next: boolean) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SPELLCHECK_STORAGE_KEY, next ? "true" : "false")
    }
    setSpellcheckEnabledState(next)
  }, [])

  const value = useMemo(
    () => ({ spellcheckEnabled, setSpellcheckEnabled }),
    [spellcheckEnabled, setSpellcheckEnabled],
  )

  return (
    <EditorSettingsContext.Provider value={value}>
      {children}
    </EditorSettingsContext.Provider>
  )
}
