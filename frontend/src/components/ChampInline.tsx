import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Champ en édition directe : sauvegarde au blur, avec retour visuel immédiat
// (bordure verte 1s si succès, rouge + message inline si échec).
// - onSave doit retourner une Promise (mutateAsync) pour que le composant sache
//   quand basculer sur « saved » ou « error ».
// - Le local state est resynchronisé depuis `valeur` uniquement quand le champ
//   n'a pas le focus (invalidation TanStack Query → refetch → nouvelle prop).
export function ChampInline({
  label,
  valeur,
  onSave,
  type = 'text',
  large = false,
  multiline = false,
  placeholder = '—',
}: {
  label?: string;
  valeur: string;
  onSave: (v: string) => Promise<unknown>;
  type?: 'text' | 'date' | 'email' | 'tel';
  large?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(valeur);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const el = multiline ? textareaRef.current : inputRef.current;
    if (document.activeElement !== el) setLocal(valeur);
  }, [valeur, multiline]);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const save = async () => {
    const el = multiline ? textareaRef.current : inputRef.current;
    const v = el?.value ?? '';
    if (v.trim() === valeur.trim()) { setStatus('idle'); setErrorMsg(null); return; }
    setStatus('saving');
    setErrorMsg(null);
    try {
      await onSave(v);
      setStatus('saved');
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setStatus('idle'), 1200);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Échec de l\'enregistrement';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const borderCls =
    status === 'saved' ? 'border-green-500 ring-2 ring-green-200' :
    status === 'error' ? 'border-red-500 ring-2 ring-red-200' :
    status === 'saving' ? 'border-teal ring-2 ring-teal/20' :
    'border-gray-300 focus:border-teal';

  const baseCls = cn(
    'px-2 py-1.5 text-sm border rounded bg-white focus:outline-none transition-colors',
    borderCls,
    large ? 'w-full' : 'w-56'
  );

  return (
    <label className="flex flex-col gap-0.5 min-w-0">
      {label && <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</span>}
      {multiline ? (
        <textarea
          ref={textareaRef}
          rows={2}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) (e.target as HTMLTextAreaElement).blur(); }}
          placeholder={placeholder}
          className={cn(baseCls, 'resize-y min-h-[2.75rem] leading-snug')}
        />
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder={placeholder}
          title={local || undefined}
          className={baseCls}
        />
      )}
      {status === 'error' && errorMsg && (
        <span className="text-xs text-red-600 mt-0.5 leading-snug" role="alert">{errorMsg}</span>
      )}
      {status === 'saved' && (
        <span className="text-xs text-green-700 mt-0.5" role="status">Enregistré</span>
      )}
    </label>
  );
}
