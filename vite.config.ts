import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { reviewMdDevApi } from "./plugins/review-md-dev-api"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv picks up .env, .env.local, .env.[mode], .env.[mode].local (REVIEW_MD_FILE is not VITE_-prefixed)
  const env = loadEnv(mode, process.cwd(), "")
  const reviewMdFile = env.REVIEW_MD_FILE?.trim()
  const useDevFileApi = Boolean(reviewMdFile)

  if (mode === "development" && useDevFileApi) {
    const resolved = path.isAbsolute(reviewMdFile!)
      ? path.normalize(reviewMdFile!)
      : path.resolve(process.cwd(), reviewMdFile!)
    console.info(`[review-md] dev: REVIEW_MD_FILE → ${resolved}`)
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(useDevFileApi ? [reviewMdDevApi(reviewMdFile!)] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: useDevFileApi
      ? {}
      : {
          proxy: {
            "/api": "http://localhost:4700",
          },
        },
    build: {
      outDir: "dist/client",
      emptyOutDir: true,
    },
  }
})
