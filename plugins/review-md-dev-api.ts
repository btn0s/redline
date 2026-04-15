import fs from "fs"
import path from "path"
import type { Plugin } from "vite"

/**
 * In development, serves GET/PUT /api/file from disk when REVIEW_MD_FILE is set
 * (path relative to cwd or absolute). Lets `pnpm dev` work without the CLI.
 */
export function reviewMdDevApi(fileFromEnv: string): Plugin {
  const resolved = path.isAbsolute(fileFromEnv)
    ? path.normalize(fileFromEnv)
    : path.resolve(process.cwd(), fileFromEnv)

  return {
    name: "review-md-dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? ""
        if (pathname !== "/api/file") {
          next()
          return
        }

        res.setHeader("Access-Control-Allow-Origin", "*")

        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
          res.setHeader("Access-Control-Allow-Headers", "Content-Type")
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === "GET") {
          try {
            if (!fs.existsSync(resolved)) {
              res.setHeader("Content-Type", "application/json")
              res.statusCode = 404
              res.end(
                JSON.stringify({
                  error: `File not found: ${resolved}. Create it or fix REVIEW_MD_FILE.`,
                }),
              )
              return
            }
            const content = fs.readFileSync(resolved, "utf-8")
            const filename = path.basename(resolved)
            res.setHeader("Content-Type", "application/json")
            res.statusCode = 200
            res.end(JSON.stringify({ content, filename }))
          } catch (e) {
            res.setHeader("Content-Type", "application/json")
            res.statusCode = 500
            res.end(
              JSON.stringify({
                error: e instanceof Error ? e.message : "Failed to read file",
              }),
            )
          }
          return
        }

        if (req.method === "PUT") {
          let body = ""
          req.on("data", (chunk: Buffer | string) => {
            body += chunk
          })
          req.on("end", () => {
            try {
              const parsed = JSON.parse(body) as { content?: string }
              if (typeof parsed.content !== "string") {
                res.statusCode = 400
                res.end(JSON.stringify({ error: "Expected { content: string }" }))
                return
              }
              fs.writeFileSync(resolved, parsed.content, "utf-8")
              res.setHeader("Content-Type", "application/json")
              res.statusCode = 200
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.setHeader("Content-Type", "application/json")
              res.statusCode = 500
              res.end(
                JSON.stringify({
                  error: e instanceof Error ? e.message : "Failed to write file",
                }),
              )
            }
          })
          return
        }

        res.statusCode = 405
        res.end()
      })
    },
  }
}
