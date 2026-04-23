/**
 * Page Mes cas d'usage — Vue 360° sectorielle autonome
 * Route : /mes-cas-usage (accessible a toutes les institutions)
 *
 * Regroupe les 4 blocs Vue 360° :
 *  - Sollicitations en attente d'avis
 *  - Mes cas d'usage inities
 *  - Radar sectoriel
 *  - Cas d'usage qui me concernent
 */

import { SollicitationsBlock } from './SollicitationsBlock';
import { MesCasUsageInitiesBlock } from './MesCasUsageInitiesBlock';
import { QuiMeConcernentBlock } from './QuiMeConcernentBlock';
import { RadarSectorielBlock } from './RadarSectorielBlock';

export function MesCasUsagePage() {
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy">Mes cas d'usage</h1>
        <p className="text-xs text-gray-500 mt-1">Cycle de vie et sollicitations concernant mon institution</p>
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
    </div>
  );
}
