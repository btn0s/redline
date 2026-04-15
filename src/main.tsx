import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Agentation } from "agentation"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"
import App from "./App.tsx"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
        {import.meta.env.DEV && <Agentation />}
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
