#!/usr/bin/env python3
"""
Webhook listener GitHub → deploiement automatique DPI-INTEROP

Ecoute sur 127.0.0.1:9000 (loopback uniquement, nginx proxy public).
Valide la signature HMAC-SHA256 GitHub avant de declencher le deploy.
Ne declenche que sur push sur la branche 'main'.

Variables d'environnement attendues :
    WEBHOOK_SECRET : secret HMAC partage avec GitHub (obligatoire)
    DEPLOY_SCRIPT  : chemin du script a lancer (default: /opt/dpi-interop/deploy-prod.sh)
    LOG_FILE       : chemin log audit (default: /var/log/dpi-webhook.log)

Usage (manuel) :
    WEBHOOK_SECRET='xxx' python3 webhook-deploy.py

Usage (systemd) : voir ops/webhook-deploy.service
"""

import hashlib
import hmac
import json
import os
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 9000
DEPLOY_SCRIPT = os.environ.get("DEPLOY_SCRIPT", "/opt/dpi-interop/deploy-prod.sh")
LOG_FILE = os.environ.get("LOG_FILE", "/var/log/dpi-webhook.log")
SECRET = os.environ.get("WEBHOOK_SECRET", "").encode("utf-8")
ALLOWED_BRANCH = "main"
MAX_PAYLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

# Lock global : empecher deux deploiements paralleles
deploy_lock = threading.Lock()


def log(msg: str, level: str = "INFO"):
    ts = datetime.now(timezone.utc).isoformat()
    line = f"[{ts}] [{level}] {msg}\n"
    sys.stdout.write(line)
    sys.stdout.flush()
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass  # log file non critique


def verify_signature(payload: bytes, signature_header: str) -> bool:
    """Compare HMAC-SHA256 en temps constant pour eviter timing attacks."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(SECRET, payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)


def run_deploy():
    """Lance le script de deploy en arriere plan. Un seul deploy a la fois."""
    if not deploy_lock.acquire(blocking=False):
        log("Deploy deja en cours, ignore", "WARN")
        return
    try:
        log(f"Lancement {DEPLOY_SCRIPT}")
        proc = subprocess.run(
            ["bash", DEPLOY_SCRIPT],
            cwd=os.path.dirname(DEPLOY_SCRIPT),
            capture_output=True,
            text=True,
            timeout=900,  # 15 min max
        )
        if proc.returncode == 0:
            log(f"Deploy OK (returncode=0)")
        else:
            log(f"Deploy ECHEC (returncode={proc.returncode})", "ERROR")
            log(f"STDERR (100 chars): {proc.stderr[:100]}", "ERROR")
    except subprocess.TimeoutExpired:
        log("Deploy TIMEOUT apres 15 min", "ERROR")
    except Exception as e:
        log(f"Exception durant deploy: {type(e).__name__}", "ERROR")
    finally:
        deploy_lock.release()


class WebhookHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override pour rediriger les logs HTTP vers notre logger."""
        log(f"{self.address_string()} - {format % args}", "HTTP")

    def do_GET(self):
        # Endpoint health pour monitoring
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/deploy":
            self.send_response(404)
            self.end_headers()
            return

        # Lecture payload avec limite
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > MAX_PAYLOAD_BYTES:
            log(f"Payload trop gros ({content_length} bytes) refuse", "WARN")
            self.send_response(413)
            self.end_headers()
            return

        payload = self.rfile.read(content_length)

        # Verification signature HMAC
        signature = self.headers.get("X-Hub-Signature-256", "")
        if not verify_signature(payload, signature):
            log(f"Signature HMAC invalide depuis {self.address_string()}", "WARN")
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'{"error":"invalid signature"}')
            return

        # Parse event
        event = self.headers.get("X-GitHub-Event", "")
        if event == "ping":
            log("Ping GitHub recu, signature OK")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"pong"}')
            return

        if event != "push":
            log(f"Event ignore: {event}")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ignored","event":"' + event.encode() + b'"}')
            return

        # Parse JSON pour verifier la branche
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            return

        ref = data.get("ref", "")
        expected_ref = f"refs/heads/{ALLOWED_BRANCH}"
        if ref != expected_ref:
            log(f"Push sur {ref} ignore (attendu {expected_ref})")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ignored","reason":"branch"}')
            return

        # Commit info pour audit
        commits = data.get("commits", [])
        head_commit = data.get("head_commit", {})
        author = head_commit.get("author", {}).get("name", "?")
        commit_id = head_commit.get("id", "?")[:8]
        log(f"Push main accepte — commit {commit_id} par {author} ({len(commits)} commits)")

        # Deploy en arriere plan pour repondre rapidement
        threading.Thread(target=run_deploy, daemon=True).start()

        self.send_response(202)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"accepted","deploy":"triggered"}')


def main():
    if not SECRET:
        log("WEBHOOK_SECRET non defini — refus de demarrer", "FATAL")
        sys.exit(1)

    if not os.path.isfile(DEPLOY_SCRIPT):
        log(f"DEPLOY_SCRIPT introuvable: {DEPLOY_SCRIPT}", "FATAL")
        sys.exit(1)

    log(f"Webhook listener demarre sur {LISTEN_HOST}:{LISTEN_PORT}")
    log(f"Script de deploy: {DEPLOY_SCRIPT}")
    log(f"Branche autorisee: {ALLOWED_BRANCH}")

    server = HTTPServer((LISTEN_HOST, LISTEN_PORT), WebhookHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log("Arret demande")
        server.shutdown()


if __name__ == "__main__":
    main()
