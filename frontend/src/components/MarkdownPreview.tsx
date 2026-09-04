import React from 'react';

// Renderer markdown minimal : headings, listes, gras, tables GitHub.
// Réutilisé par l'éditeur plein écran (variant="full") et par l'aperçu
// des blocs Note d'instruction sur la fiche 360° (variant="preview").
// Pas de HTML brut, tout passe par React → aucun risque XSS.

type Variant = 'full' | 'preview';

const STYLES: Record<Variant, {
  h1: string; h2: string; h3: string;
  p: string; li: string;
  tableWrap: string; table: string; th: string; td: string;
  ul: string; spacer: string;
}> = {
  full: {
    h1: 'text-lg font-bold text-navy mt-6 mb-2',
    h2: 'text-base font-bold text-navy mt-5 mb-2 pb-1 border-b',
    h3: 'text-sm font-bold text-navy mt-4 mb-1',
    p: 'text-sm text-gray-700 my-1',
    li: 'text-sm text-gray-700',
    tableWrap: 'my-3 overflow-x-auto',
    table: 'text-xs border-collapse w-full',
    th: 'border border-gray-300 bg-gray-50 px-2 py-1 text-left font-semibold text-navy',
    td: 'border border-gray-300 px-2 py-1 align-top',
    ul: 'list-disc pl-5 space-y-1 my-2',
    spacer: 'h-2',
  },
  preview: {
    // Contexte aperçu sur la fiche : la hiérarchie visuelle appartient à la
    // fiche, pas à la note. Titres réduits, marges compressées, pas de border.
    h1: 'text-sm font-bold text-navy mt-2 mb-0.5',
    h2: 'text-xs font-bold text-navy mt-2 mb-0.5 uppercase tracking-wide',
    h3: 'text-[11px] font-semibold text-navy mt-1 mb-0.5',
    p: 'text-xs text-gray-700 my-0.5',
    li: 'text-xs text-gray-700',
    tableWrap: 'my-1 overflow-x-hidden',
    table: 'text-[10px] border-collapse w-full',
    th: 'border border-gray-300 bg-gray-100 px-1 py-0.5 text-left font-semibold text-navy',
    td: 'border border-gray-300 px-1 py-0.5 align-top',
    ul: 'list-disc pl-4 space-y-0.5 my-1',
    spacer: 'h-1',
  },
};

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    return <span key={i}>{p}</span>;
  });
}

export function MarkdownPreview({ source, variant = 'full' }: { source: string; variant?: Variant }) {
  const s = STYLES[variant];
  const lines = source.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className={s.ul}>
        {listBuffer.map((li, i) => <li key={i} className={s.li}>{renderInline(li)}</li>)}
      </ul>
    );
    listBuffer = [];
  };

  const splitRow = (line: string): string[] => {
    const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return trimmed.split('|').map(c => c.trim());
  };
  const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
  const isTableSep = (line: string) => /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushList();
      const header = splitRow(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      blocks.push(
        <div key={`t-${i}`} className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>{header.map((h, k) => <th key={k} className={s.th}>{renderInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci} className={s.td}>{renderInline(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j - 1;
      continue;
    }
    if (line.startsWith('### ')) { flushList(); blocks.push(<h3 key={i} className={s.h3}>{line.slice(4)}</h3>); }
    else if (line.startsWith('## ')) { flushList(); blocks.push(<h2 key={i} className={s.h2}>{line.slice(3)}</h2>); }
    else if (line.startsWith('# ')) { flushList(); blocks.push(<h1 key={i} className={s.h1}>{line.slice(2)}</h1>); }
    else if (line.startsWith('- ') || line.startsWith('* ')) { listBuffer.push(line.slice(2)); }
    else if (line.trim() === '') { flushList(); blocks.push(<div key={i} className={s.spacer} />); }
    else { flushList(); blocks.push(<p key={i} className={s.p}>{renderInline(line)}</p>); }
  }
  flushList();
  if (blocks.length === 0) return <p className="text-sm text-gray-400 italic">Prévisualisation vide.</p>;
  return <div>{blocks}</div>;
}
