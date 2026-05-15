import { useEffect, useRef } from 'react';

/**
 * Détecte l'inactivité utilisateur et déclenche un callback après timeoutMs.
 *
 * Évènements écoutés : mousemove, mousedown, keydown, scroll, touchstart, click.
 * Tout évènement reset le timer.
 *
 * Aligné avec le TTL backend (cleanup automatique des sessions inactives > 10 min).
 * Côté backend, l'inactivité = absence de requête API.
 * Côté frontend, l'inactivité = absence d'interaction utilisateur.
 *
 * Les deux notions diffèrent légèrement (ex: requêtes auto-refresh react-query
 * prolongent la session backend mais pas le timer frontend), mais convergent :
 * un user qui ne touche à rien est inactif des deux côtés.
 */
export function useInactivityLogout(timeoutMs: number, onTimeout: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Garde la référence du callback à jour sans recréer les listeners
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onTimeoutRef.current(), timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach((evt) => window.addEventListener(evt, reset, { passive: true }));
    reset(); // démarre le timer

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [timeoutMs]);
}
