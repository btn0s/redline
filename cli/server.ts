import { createServer, type IncomingMessage, type ServerResponse } from "http"
import { createHash } from "crypto"
import { readFileSync, writeFileSync, existsSync, statSync } from "fs"
import { join, dirname, basename, relative } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export function startServer(filePath: string, port: number): Promise<string> {
  const clientDir = join(__dirname, "../client")
  const useClientDir = existsSync(clientDir)

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url!, `http://localhost:${port}`)

    // API: file metadata (mtime/size/rev)
    if (url.pathname === "/api/file/meta" && req.method === "GET") {
      try {
        const st = statSync(filePath)
        const rev = createHash("sha256")
          .update(`${st.mtimeMs}:${st.size}`)
          .digest("hex")
          .slice(0, 16)
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        })
        res.end(
          JSON.stringify({
            mtimeMs: st.mtimeMs,
            size: st.size,
            rev,
          }),
        )
      } catch (e) {
        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        })
        res.end(
          JSON.stringify({
            error: e instanceof Error ? e.message : "Failed to stat file",
          }),
        )
      }
      return
    }

    // API: read file
    if (url.pathname === "/api/file" && req.method === "GET") {
      const content = readFileSync(filePath, "utf-8")
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      })
      const filename = basename(filePath)
      const displayPath =
        relative(process.cwd(), filePath).split(/[/\\]/).join("/") ||
        filename
      res.end(JSON.stringify({ content, filename, path: displayPath }))
      return
    }

    // API: write file
    if (url.pathname === "/api/file" && req.method === "PUT") {
      let body = ""
      for await (const chunk of req) body += chunk
      const { content } = JSON.parse(body) as { content: string }
      writeFileSync(filePath, content, "utf-8")
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      })
      res.end(JSON.stringify({ ok: true }))
      return
    }

    // CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      })
      res.end()
      return
    }

    // Static files (production only — in dev, Vite handles this)
    if (useClientDir) {
      const fileParts = url.pathname === "/" ? "/index.html" : url.pathname
      const staticPath = join(clientDir, fileParts)
      if (existsSync(staticPath)) {
        const ext = staticPath.split(".").pop()
        const mimeTypes: Record<string, string> = {
          html: "text/html",
          js: "application/javascript",
          css: "text/css",
          svg: "image/svg+xml",
          png: "image/png",
          json: "application/json",
        }
        res.writeHead(200, {
          "Content-Type": mimeTypes[ext!] || "application/octet-stream",
        })
        res.end(readFileSync(staticPath))
        return
      }
      // SPA fallback
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(readFileSync(join(clientDir, "index.html")))
      return
    }

    res.writeHead(404)
    res.end("Not found")
  })

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve(`http://localhost:${port}`)
    })
  })
}
