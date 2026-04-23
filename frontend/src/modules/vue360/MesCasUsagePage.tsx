/**
 * Page Mes cas d'usage — Vue 360° sectorielle autonome
 * Route : /mes-cas-usage (accessible a toutes les institutions)
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SollicitationsBlock } from './SollicitationsBlock';
import { MesCasUsageInitiesBlock } from './MesCasUsageInitiesBlock';
import { QuiMeConcernentBlock } from './QuiMeConcernentBlock';
import { RadarSectorielBlock } from './RadarSectorielBlock';
import { DeclareUseCaseModal } from './DeclareUseCaseModal';

export function MesCasUsagePage() {
  const [showDeclare, setShowDeclare] = useState(false);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header avec CTA proeminent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy">Mes cas d'usage</h1>
          <p className="text-xs text-gray-500 mt-1">Cycle de vie et sollicitations concernant mon institution</p>
        </div>
        <button
          onClick={() => setShowDeclare(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md bg-teal text-white hover:bg-teal/90 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Declarer un nouveau cas d'usage
        </button>
      </div>

      {/* Sollicitations en attente (pleine largeur) */}
      <SollicitationsBlock />

      {/* Inities + Radar (2 colonnes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MesCasUsageInitiesBlock />
        <RadarSectorielBlock />
      </div>

      {/* Qui me concernent (pleine largeur) */}
      <QuiMeConcernentBlock />

      {/* Modal declaration */}
      {showDeclare && <DeclareUseCaseModal onClose={() => setShowDeclare(false)} />}
    </div>
  );
}
