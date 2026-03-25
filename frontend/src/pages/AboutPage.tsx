import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ArrowRight, Layers, CreditCard, Fingerprint, Network, Building2, Globe, Server } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal text-white mb-6">
            <span className="text-4xl font-bold">e</span>
          </div>
          <h1 className="text-4xl font-bold text-gold mb-4">e-jokkoo</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Plateforme Nationale d'Interopérabilité du Sénégal
          </p>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Construire un Sénégal où chaque citoyen accède de manière sécurisée, équitable et instantanée
            aux services publics grâce à une infrastructure publique numérique ouverte, interopérable et résiliente.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link to="/login">
              <Button className="bg-teal hover:bg-teal-dark text-white px-8 py-3">
                Accéder au questionnaire <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-6">
            Référence : New Deal Technologique — Vision Sénégal 2050
          </p>
        </div>
      </div>

      {/* Section 2 — Les 3 Building Blocks DPI */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-navy text-center mb-2">Infrastructure Publique Numérique (DPI)</h2>
        <p className="text-gray-500 text-center mb-12">Les 3 composants fondamentaux de l'écosystème numérique sénégalais</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-2 border-success/30 hover:border-success/60 transition-colors">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">Identité Numérique</h3>
              <p className="text-sm text-gray-500">
                Identification unique des citoyens (NIN), des entreprises (NINEA),
                des agents de l'État et des objets connectés.
              </p>
              <div className="mt-4 text-xs text-success font-medium">COUCHE FONDATION</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal/30 hover:border-teal/60 transition-colors">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-4">
                <Network className="w-8 h-8 text-teal" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">Échange de Données</h3>
              <p className="text-sm text-gray-500">
                Plateforme e-jokkoo basée sur X-Road pour l'échange sécurisé
                et tracé de données entre administrations.
              </p>
              <div className="mt-4 text-xs text-teal font-medium">COUCHE FONDATION</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gold/30 hover:border-gold/60 transition-colors">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2">Passerelle de Paiement</h3>
              <p className="text-sm text-gray-500">
                Infrastructure centralisée pour les paiements gouvernementaux,
                taxes, frais administratifs et transferts sociaux.
              </p>
              <div className="mt-4 text-xs text-gold font-medium">COUCHE FONDATION</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 3 — Les 5 niveaux */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-navy text-center mb-2">Les 5 niveaux d'interopérabilité</h2>
          <p className="text-gray-500 text-center mb-12">Cadre National d'Interopérabilité du Sénégal</p>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { level: 'Politique', color: '#0C1F3A', icon: Building2, desc: 'Engagement de la hiérarchie, alignement stratégique, ressources dédiées' },
              { level: 'Juridique', color: '#C55A18', icon: Shield, desc: 'Cadre réglementaire, conventions d\'échange, conformité CDP' },
              { level: 'Organisationnel', color: '#0A6B68', icon: Layers, desc: 'Processus, rôles, coordination inter-administrations' },
              { level: 'Sémantique', color: '#D4A820', icon: Globe, desc: 'Référentiels communs, dictionnaire de données, nomenclatures' },
              { level: 'Technique', color: '#2D6A4F', icon: Server, desc: 'Infrastructure, API, sécurité, X-Road readiness' },
            ].map((item, i) => (
              <div key={i} className="flex items-center space-x-4 bg-white rounded-xl p-5 shadow-sm border">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.color + '15' }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: item.color }}>
                      NIVEAU {i + 1}
                    </span>
                    <h4 className="font-semibold text-navy">{item.level}</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4 — Comment ça marche X-Road */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-navy text-center mb-2">Comment ça marche ?</h2>
        <p className="text-gray-500 text-center mb-12">Échange sécurisé via X-Road en 3 étapes</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Installation', desc: 'L\'institution installe un Security Server connecté au réseau e-jokkoo', color: 'teal' },
            { step: '2', title: 'Publication', desc: 'Elle publie ses services de données (API) sur la plateforme centrale', color: 'gold' },
            { step: '3', title: 'Consommation', desc: 'Les autres institutions consomment ces services de manière sécurisée et tracée', color: 'success' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className={`w-16 h-16 rounded-full bg-${item.color}/10 flex items-center justify-center mx-auto mb-4`}>
                <span className={`text-2xl font-bold text-${item.color}`}>{item.step}</span>
              </div>
              <h4 className="font-semibold text-navy mb-2">{item.title}</h4>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-navy/5 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-navy font-medium">
            <span className="px-3 py-1 bg-teal/10 text-teal rounded">Institution A</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="px-3 py-1 bg-navy/10 text-navy rounded">Security Server</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="px-3 py-1 bg-gold/10 text-gold rounded">Central Server</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="px-3 py-1 bg-navy/10 text-navy rounded">Security Server</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="px-3 py-1 bg-success/10 text-success rounded">Institution B</span>
          </div>
          <p className="text-xs text-gray-400 mt-3">Chaque transaction est chiffrée, signée et journalisée</p>
        </div>
      </div>

      {/* Section 5 — Contact */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gold mb-4">Participez au projet d'interopérabilité</h2>
          <p className="text-gray-300 mb-8">
            Votre institution souhaite rejoindre la plateforme e-jokkoo ?
            Remplissez le questionnaire de collecte des besoins.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/login">
              <Button className="bg-teal hover:bg-teal-dark text-white px-8">
                Accéder au questionnaire
              </Button>
            </Link>
          </div>
          <div className="mt-8 text-sm text-gray-400">
            <p>SENUM — Secrétariat d'État au Numérique</p>
            <p className="mt-1">Ministère de la Communication, des Télécommunications et du Numérique</p>
            <p className="mt-1">Email : dpi.interop@numerique.gouv.sn</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-gray-400 bg-navy-dark">
        SENUM / MCTN — République du Sénégal — {new Date().getFullYear()}
      </div>
    </div>
  );
}
