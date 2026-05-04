import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepProps } from '../lib/questionnaireTypes';

// Section 1 — Identification + Gouvernance des donnees (Data Owner / Data Steward).
// Extraite de pages/QuestionnairePage.tsx (lignes 379-507) sans changement de logique.
export function Step1Infos({ formData, setFormData, isReadOnly, submissionInstitution }: StepProps) {
  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      {/* Infos institution (lecture seule) */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Informations de l'institution</h3>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Code</dt>
            <dd className="font-medium">{submissionInstitution?.code}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Nom</dt>
            <dd className="font-medium">{submissionInstitution?.nom}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Ministere</dt>
            <dd className="font-medium">{submissionInstitution?.ministere}</dd>
          </div>
        </dl>
      </div>

      {/* Data Owner */}
      <div className="border border-teal-100 rounded-lg p-5 bg-teal-50/30">
        <h3 className="font-semibold text-navy mb-1">Data Owner (Responsable des donnees)</h3>
        <p className="text-xs text-gray-500 italic mb-4">
          Le Data Owner est le decideur institutionnel qui a autorite sur les donnees de son domaine et valide les regles de partage.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nom et prenom</Label>
            <Input value={formData.dataOwnerNom} onChange={e => update('dataOwnerNom', e.target.value)} disabled={isReadOnly} placeholder="Ex: Mamadou DIALLO" />
          </div>
          <div>
            <Label>Fonction</Label>
            <Input value={formData.dataOwnerFonction} onChange={e => update('dataOwnerFonction', e.target.value)} disabled={isReadOnly} placeholder="Ex: Directeur General" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={formData.dataOwnerEmail} onChange={e => update('dataOwnerEmail', e.target.value)} disabled={isReadOnly} placeholder="email@institution.sn" />
          </div>
          <div>
            <Label>Telephone</Label>
            <Input value={formData.dataOwnerTelephone} onChange={e => update('dataOwnerTelephone', e.target.value)} disabled={isReadOnly} placeholder="+221 XX XXX XX XX" />
          </div>
        </div>
      </div>

      {/* Data Steward */}
      <div className="border border-gold/30 rounded-lg p-5 bg-gold-50/30">
        <h3 className="font-semibold text-navy mb-1">Data Steward (Correspondant operationnel interoperabilite)</h3>
        <p className="text-xs text-gray-500 italic mb-4">
          Le Data Steward est le correspondant technique responsable de la qualite des donnees et de la mise a disposition via PINS.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nom et prenom</Label>
            <Input value={formData.dataStewardNom} onChange={e => update('dataStewardNom', e.target.value)} disabled={isReadOnly} placeholder="Ex: Fatou NDIAYE" />
          </div>
          <div>
            <Label>Profil technique</Label>
            <Input value={formData.dataStewardProfil} onChange={e => update('dataStewardProfil', e.target.value)} disabled={isReadOnly} placeholder="Ex: Ingenieur SI" />
          </div>
          <div>
            <Label>Fonction</Label>
            <Input value={formData.dataStewardFonction} onChange={e => update('dataStewardFonction', e.target.value)} disabled={isReadOnly} placeholder="Ex: Chef de division SI" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={formData.dataStewardEmail} onChange={e => update('dataStewardEmail', e.target.value)} disabled={isReadOnly} placeholder="email@institution.sn" />
          </div>
          <div>
            <Label>Telephone</Label>
            <Input value={formData.dataStewardTelephone} onChange={e => update('dataStewardTelephone', e.target.value)} disabled={isReadOnly} placeholder="+221 XX XXX XX XX" />
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Verifiez les informations ci-dessus. Si les donnees institution sont incorrectes, contactez l'administrateur SENUM.
      </p>
    </div>
  );
}
