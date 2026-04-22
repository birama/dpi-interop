import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '@/services/api';
import { Search, FileText, Building2, FileCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUT_COLORS: Record<string, string> = {
  IDENTIFIE: 'bg-gray-100 text-gray-600',
  PRIORISE: 'bg-gold-50 text-gold',
  EN_PREPARATION: 'bg-orange-100 text-orange-700',
  EN_DEVELOPPEMENT: 'bg-blue-100 text-blue-600',
  EN_TEST: 'bg-teal-50 text-teal',
  EN_PRODUCTION: 'bg-emerald-50 text-emerald-700',
  SUSPENDU: 'bg-red-50 text-red-500',
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(null);
      setSelectedIdx(0);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const r = await searchApi.search(q);
      setResults(r.data);
      setSelectedIdx(0);
    } catch { setResults(null); }
    setLoading(false);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  // Flatten results for keyboard navigation
  const allItems: { type: string; item: any }[] = [];
  if (results) {
    results.casUsage?.forEach((i: any) => allItems.push({ type: 'cu', item: i }));
    results.institutions?.forEach((i: any) => allItems.push({ type: 'inst', item: i }));
    results.conventions?.forEach((i: any) => allItems.push({ type: 'conv', item: i }));
    results.users?.forEach((i: any) => allItems.push({ type: 'user', item: i }));
  }

  const handleSelect = (type: string, item: any) => {
    setOpen(false);
    if (type === 'cu') navigate(`/admin/cas-usage/${item.id}`);
    else if (type === 'inst') navigate(`/admin/institution/${item.id}`);
    else if (type === 'conv') navigate('/admin/conventions');
    else if (type === 'user') navigate('/admin/utilisateurs');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && allItems[selectedIdx]) {
      e.preventDefault();
      handleSelect(allItems[selectedIdx].type, allItems[selectedIdx].item);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border overflow-hidden mx-4">
        {/* Search input */}
        <div className="flex items-center px-4 border-b">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un cas d'usage, une institution, une convention..."
            className="flex-1 px-3 py-4 text-sm outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-100 rounded border">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && <div className="p-4 text-center text-sm text-gray-400">Recherche...</div>}

          {!loading && results && allItems.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">Aucun résultat pour "{query}"</div>
          )}

          {!loading && results && (
            <div className="py-2">
              {/* Cas d'usage */}
              {results.casUsage?.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Cas d'usage
                  </div>
                  {results.casUsage.map((cu: any, idx: number) => {
                    const globalIdx = idx;
                    return (
                      <button
                        key={cu.id}
                        onClick={() => handleSelect('cu', cu)}
                        className={cn('w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-50', selectedIdx === globalIdx && 'bg-teal-50')}
                      >
                        <span className="text-xs font-mono text-teal bg-teal-50 px-1.5 py-0.5 rounded">{cu.code}</span>
                        <span className="text-sm text-navy truncate flex-1">{cu.titre}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px]', STATUT_COLORS[cu.statutImpl])}>{cu.statutImpl}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Institutions */}
              {results.institutions?.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3 h-3" /> Institutions
                  </div>
                  {results.institutions.map((inst: any, idx: number) => {
                    const globalIdx = (results.casUsage?.length || 0) + idx;
                    return (
                      <button
                        key={inst.id}
                        onClick={() => handleSelect('inst', inst)}
                        className={cn('w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-50', selectedIdx === globalIdx && 'bg-teal-50')}
                      >
                        <span className="text-xs font-mono font-bold text-navy">{inst.code}</span>
                        <span className="text-sm text-gray-700 truncate flex-1">{inst.nom}</span>
                        <span className="text-[10px] text-gray-400">{inst.ministere}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Conventions */}
              {results.conventions?.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <FileCheck className="w-3 h-3" /> Conventions
                  </div>
                  {results.conventions.map((conv: any, idx: number) => {
                    const globalIdx = (results.casUsage?.length || 0) + (results.institutions?.length || 0) + idx;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelect('conv', conv)}
                        className={cn('w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-50', selectedIdx === globalIdx && 'bg-teal-50')}
                      >
                        <span className="text-sm text-navy truncate flex-1">
                          {conv.institutionA?.code} <span className="text-gray-400">&#8596;</span> {conv.institutionB?.code} : {conv.objet}
                        </span>
                        <span className="text-[10px] text-gray-400">{conv.statut}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Users */}
              {results.users?.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <Users className="w-3 h-3" /> Utilisateurs
                  </div>
                  {results.users.map((u: any, idx: number) => {
                    const globalIdx = (results.casUsage?.length || 0) + (results.institutions?.length || 0) + (results.conventions?.length || 0) + idx;
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelect('user', u)}
                        className={cn('w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-50', selectedIdx === globalIdx && 'bg-teal-50')}
                      >
                        <span className="text-sm text-navy">{u.email}</span>
                        {u.institution && <span className="text-[10px] text-gray-400">{u.institution.code} — {u.institution.nom}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!loading && !results && (
            <div className="p-6 text-center text-sm text-gray-400">
              Tapez au moins 2 caractères pour lancer la recherche
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="px-1 bg-white border rounded text-[9px]">&uarr;&darr;</kbd> naviguer</span>
          <span><kbd className="px-1 bg-white border rounded text-[9px]">Enter</kbd> ouvrir</span>
          <span><kbd className="px-1 bg-white border rounded text-[9px]">Esc</kbd> fermer</span>
        </div>
      </div>
    </div>
  );
}
