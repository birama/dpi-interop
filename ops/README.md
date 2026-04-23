# Ops — Webhook auto-deploy DPI-INTEROP

Architecture :

```
GitHub push sur main
       ↓ POST /webhook/deploy (avec signature HMAC-SHA256)
https://dpi-interop.senum.sn/webhook/deploy
       ↓ nginx proxy (pins-frontend)
http://host.docker.internal:9000/deploy
       ↓ listener Python (systemd)
validation HMAC + branche == main
       ↓
bash /opt/dpi-interop/deploy-prod.sh (async)
```

## Installation initiale

Une seule fois sur le serveur :

```bash
cd /opt/dpi-interop
git pull
sudo bash ops/install-webhook-complete.sh
```

Le script :
1. Installe python3 si besoin
2. Génère un secret HMAC aléatoire (affiché UNE SEULE FOIS)
3. Configure le service systemd `dpi-webhook`
4. Rebuild et relance pins-frontend avec `--add-host=host.docker.internal:host-gateway`
5. Teste le bout en bout

À la fin, le script te demande de créer le webhook GitHub :

- URL : `https://github.com/birama/dpi-interop/settings/hooks/new`
- Payload URL : `https://dpi-interop.senum.sn/webhook/deploy`
- Content type : `application/json`
- Secret : le secret affiché par le script
- Events : `Just the push event`
- SSL verification : activée

## Utilisation quotidienne

Après installation, chaque `git push origin main` déclenche automatiquement un redéploiement.

Pour voir les logs en temps réel :

```bash
# Logs systemd (événements listener + deploys)
journalctl -u dpi-webhook -f

# Log d'audit du listener (tous les webhooks reçus + signatures vérifiées)
tail -f /var/log/dpi-webhook.log
```

## Sécurité

- Le listener écoute uniquement sur `127.0.0.1:9000` (loopback hôte).
- nginx (dans `pins-frontend`) atteint le listener via `host.docker.internal`, ajouté comme host-gateway au container.
- Signature HMAC-SHA256 obligatoire. Toute requête sans `X-Hub-Signature-256` valide → 401.
- Le secret est stocké dans `/etc/dpi-webhook.env` avec permissions `600 root:root`.
- Seuls les push sur la branche `main` déclenchent un déploiement (les PR, tags, autres branches sont ignorés).
- Un lock applicatif empêche deux déploiements simultanés.
- Le déploiement tourne sous l'utilisateur `deploy` (pas root).

## Debug

### Le webhook retourne 401

Signature HMAC invalide. Vérifier que le secret GitHub correspond à celui du serveur :

```bash
sudo grep WEBHOOK_SECRET /etc/dpi-webhook.env
```

Comparer avec celui configuré dans GitHub Settings → Webhooks.

### Le déploiement ne se déclenche pas après un push

```bash
# Verifier que le webhook arrive bien
journalctl -u dpi-webhook -n 20

# Tester la route HTTPS publique
curl -sI https://dpi-interop.senum.sn/webhook/health
# Attendu : HTTP/1.1 200 OK

# Tester que nginx joint bien le listener
docker exec pins-frontend wget -qO- http://host.docker.internal:9000/health
# Attendu : {"status":"ok"}
```

### Le listener est down

```bash
sudo systemctl status dpi-webhook
sudo systemctl restart dpi-webhook
```

### Forcer un déploiement manuel

Le webhook est optionnel — le déploiement classique reste dispo :

```bash
bash /opt/dpi-interop/deploy-prod.sh
```

## Rotation du secret

Si le secret fuite ou après un audit :

```bash
# Génère un nouveau secret
NEW_SECRET=$(openssl rand -hex 32)
sudo sed -i "s|^WEBHOOK_SECRET=.*|WEBHOOK_SECRET=$NEW_SECRET|" /etc/dpi-webhook.env
sudo systemctl restart dpi-webhook

echo "Nouveau secret (à mettre dans GitHub Webhook Settings) :"
echo "$NEW_SECRET"
unset NEW_SECRET
```

Puis mettre à jour le secret dans GitHub Settings → Webhooks.
