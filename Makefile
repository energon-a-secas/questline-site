.DEFAULT_GOAL := help

PORT = 8832

# ── Help ──────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  make serve    Start dev server → http://localhost:$(PORT)"
	@echo "  make kill     Kill this project's HTTP server"
	@echo ""

# ── Dev server ────────────────────────────────────────────────────────────────
# Sends Cache-Control: no-store so the browser re-fetches ES modules on every
# reload. The default server lets Chromium serve stale js/*.js across reloads.
.PHONY: serve
serve:
	@echo "Serving (no-store) → http://localhost:$(PORT)"
	@python3 -c "import http.server as h; H=type('H',(h.SimpleHTTPRequestHandler,),{'end_headers':lambda s:(s.send_header('Cache-Control','no-store, max-age=0'), super(H,s).end_headers())}); h.test(HandlerClass=H, port=$(PORT))"

# ── Kill ──────────────────────────────────────────────────────────────────────
.PHONY: kill
kill:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null && echo "Stopped server on port $(PORT)" || echo "No server running on port $(PORT)"
