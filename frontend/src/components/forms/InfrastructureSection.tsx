import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfraItem {
  domain: string;
  element: string;
  disponibilite: boolean | null;
  qualifications: string;
  observations: string;
}

interface InfrastructureSectionProps {
  items: InfraItem[];
  onChange: (items: InfraItem[]) => void;
  disabled?: boolean;
}

const DOMAINS = [
  {
    key: 'EQUIPEMENTS_SYSTEME',
    label: 'Équipements & Système',
    elements: [
      'Datacenter',
      'Serveurs en production',
      'Site de backup / DR',
      'Technologie de virtualisation',
      'Espace de stockage (SAN/NAS)',
      'Backup SI',
      'Conteneurisation (Docker/K8s)',
    ],
  },
  {
    key: 'RESEAU_CONNECTIVITE',
    label: 'Réseau & Connectivité',
    elements: [
      'Type réseau local (LAN)',
      'Connexion intranet gouvernemental (ADIE)',
      'Fibre optique',
      'Débit Internet',
      'Interconnexions directes (VPN site-à-site)',
      'Performances réseau (latence, QoS)',
      'VPN / tunnels sécurisés',
    ],
  },
  {
    key: 'API_SERVICES',
    label: 'API & Services d\'échange',
    elements: [
      'API / services web exposés',
      'Documentation API (Swagger/OpenAPI)',
      'Bus d\'intégration / ESB',
      'Format d\'échange (JSON, XML, CSV)',
      'Protocoles d\'échange (REST, SOAP, gRPC)',
      'Expérience X-Road / PINS',
    ],
  },
  {
    key: 'SECURITE_CERTIFICATS',
    label: 'Sécurité & Certificats',
    elements: [
      'Antivirus / EDR serveur',
      'Firewall / WAF',
      'Certificats SSL/TLS',
      'Signature électronique',
      'PSSI (Politique de Sécurité SI)',
      'Gestion des identités (IAM / LDAP / AD)',
    ],
  },
  {
    key: 'ENERGIE_CONTINUITE',
    label: 'Énergie & Continuité',
    elements: [
      'Sources d\'énergie datacenter',
      'Autonomie onduleurs (UPS)',
      'PRA / PCA (Plan de reprise / continuité)',
    ],
  },
  {
    key: 'RESSOURCES_HUMAINES',
    label: 'Ressources Humaines SI',
    elements: [
      'Ingénieurs RÉSEAU',
      'Ingénieurs SYSTÈME',
      'Ingénieurs SÉCURITÉ',
      'Ingénieurs DBA',
      'Développeurs',
      'Compétences intégration / API',
    ],
  },
  {
    key: 'LICENCES_LOGICIELS',
    label: 'Licences & Logiciels',
    elements: [
      'Licences Microsoft (Windows Server, SQL Server)',
      'Licences Oracle / SGBD',
      'Outils de monitoring',
      'Outils de gestion de projet',
    ],
  },
];

function getItem(items: InfraItem[], domain: string, element: string): InfraItem {
  return (
    items.find((i) => i.domain === domain && i.element === element) || {
      domain,
      element,
      disponibilite: null,
      qualifications: '',
      observations: '',
    }
  );
}

function updateItem(
  items: InfraItem[],
  domain: string,
  element: string,
  field: string,
  value: any
): InfraItem[] {
  const existing = items.findIndex((i) => i.domain === domain && i.element === element);
  const item = getItem(items, domain, element);
  const updated = { ...item, [field]: value };

  if (existing >= 0) {
    const newItems = [...items];
    newItems[existing] = updated;
    return newItems;
  }
  return [...items, updated];
}

export function InfrastructureSection({ items, onChange, disabled }: InfrastructureSectionProps) {
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>(
    Object.fromEntries(DOMAINS.map((d) => [d.key, true]))
  );

  const toggleDomain = (key: string) => {
    setOpenDomains((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (domain: string, element: string, field: string, value: any) => {
    onChange(updateItem(items, domain, element, field, value));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-navy">Infrastructure technique et capacités d'échange</h3>
        <span className="text-xs text-gray-500">Section B.3</span>
      </div>
      <p className="text-sm text-gray-500">
        Renseignez l'état de votre infrastructure technique. Pour chaque élément, indiquez sa disponibilité et ses caractéristiques.
      </p>

      {DOMAINS.map((domain) => (
        <div key={domain.key} className="border rounded-lg overflow-hidden">
          {/* Domain header - collapsible */}
          <button
            type="button"
            onClick={() => toggleDomain(domain.key)}
            className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-sm"
            style={{ backgroundColor: '#E8EDF2', color: '#0C1F3A' }}
          >
            <span>{domain.label}</span>
            {openDomains[domain.key] ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Domain content */}
          {openDomains[domain.key] && (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 border-b">
                <div className="col-span-3">Élément</div>
                <div className="col-span-2 text-center">Disponibilité</div>
                <div className="col-span-3">Qualifications</div>
                <div className="col-span-4">Observations</div>
              </div>

              {/* Rows */}
              {domain.elements.map((element, idx) => {
                const item = getItem(items, domain.key, element);
                return (
                  <div
                    key={element}
                    className={cn(
                      'grid grid-cols-12 gap-2 px-4 py-2 items-center text-sm border-b last:border-b-0',
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    )}
                  >
                    <div className="col-span-3 text-gray-700 font-medium text-xs">{element}</div>
                    <div className="col-span-2 text-center">
                      <select
                        value={item.disponibilite === null ? '' : item.disponibilite ? 'oui' : 'non'}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : e.target.value === 'oui';
                          handleChange(domain.key, element, 'disponibilite', val);
                        }}
                        disabled={disabled}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:bg-gray-100"
                      >
                        <option value="">—</option>
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={item.qualifications}
                        onChange={(e) => handleChange(domain.key, element, 'qualifications', e.target.value)}
                        disabled={disabled}
                        placeholder="Détails..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        value={item.observations}
                        onChange={(e) => handleChange(domain.key, element, 'observations', e.target.value)}
                        disabled={disabled}
                        placeholder="Spécifications / observations..."
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
