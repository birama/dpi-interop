#!/bin/bash
# PINS — Monitoring CPU anti-cryptominer
# Vérifie si un processus dépasse 80% CPU pendant plus de 5 minutes
# À exécuter via cron toutes les 5 minutes

THRESHOLD=80
LOGFILE=/opt/dpi-interop/ops/cpu-alerts.log
PIDFILE=/var/tmp/pins-cpu-monitor.pid

# Éviter les doublons
if [ -f "$PIDFILE" ]; then
  if kill -0 $(cat "$PIDFILE") 2>/dev/null; then
    exit 0
  fi
fi
echo $$ > "$PIDFILE"
trap "rm -f $PIDFILE" EXIT

# Top 5 processus CPU
TOP_PROCS=$(ps aux --sort=-%cpu | head -6 | tail -5)

# Vérifier les conteneurs Docker
DOCKER_STATS=$(docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null)

# Alerte si un processus dépasse le seuil (hors processus système normaux)
HIGH_CPU=$(echo "$TOP_PROCS" | awk -v t=$THRESHOLD '$3 > t {print $0}')

if [ -n "$HIGH_CPU" ]; then
  echo "=== ALERT CPU $(date -u) ===" >> "$LOGFILE"
  echo "TOP 5 PROCESSES:" >> "$LOGFILE"
  echo "$TOP_PROCS" >> "$LOGFILE"
  echo "" >> "$LOGFILE"
  echo "DOCKER STATS:" >> "$LOGFILE"
  echo "$DOCKER_STATS" >> "$LOGFILE"
  echo "---" >> "$LOGFILE"
fi

# Rotation du log (> 1MB)
if [ -f "$LOGFILE" ] && [ $(stat -c%s "$LOGFILE" 2>/dev/null || echo 0) -gt 1048576 ]; then
  mv "$LOGFILE" "$LOGFILE.1"
fi

exit 0
