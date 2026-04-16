import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Agentation } from "agentation"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import App from "./App.tsx"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
        <Toaster
          position="top-center"
          offset="max(0.75rem, env(safe-area-inset-top))"
        />
        {import.meta.env.DEV && <Agentation />}
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
