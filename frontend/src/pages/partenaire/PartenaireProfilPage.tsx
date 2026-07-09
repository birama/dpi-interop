import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { UserCircle, Loader2, Mail, Briefcase, Globe, Tag } from 'lucide-react';

export function PartenaireProfilPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['partenaire-profil'],
    queryFn: () => api.get('/partenaire/profil').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    );
  }

  const ptf = data?.ptf;
  const domaines = ptf?.domainesInteret?.map((d: any) => d.domaine) || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center">
          <UserCircle className="w-6 h-6 text-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Mon profil PTF</h1>
          <p className="text-sm text-gray-500">Informations de votre compte partenaire</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-navy text-lg">Compte utilisateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row icon={<Mail className="w-4 h-4 text-teal-700" />} label="Email">{data?.email}</Row>
          <Row icon={<UserCircle className="w-4 h-4 text-teal-700" />} label="Rôle">
            <Badge className="bg-gold/15 text-gold border border-gold/30">
              Partenaire Technique et Financier
            </Badge>
          </Row>
          <Row icon={<Tag className="w-4 h-4 text-teal-700" />} label="CGU acceptées">
            {data?.cguAccepteesAt ? (
              <span className="text-teal-700">{new Date(data.cguAccepteesAt).toLocaleString('fr-FR')}</span>
            ) : (
              <span className="text-amber-700 italic">En attente d'acceptation</span>
            )}
          </Row>
        </CardContent>
      </Card>

      {ptf && (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy text-lg">Organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={<Briefcase className="w-4 h-4 text-teal-700" />} label="Nom">
              {ptf.nom} {ptf.code && <span className="text-gray-400">({ptf.code})</span>}
            </Row>
            {ptf.acronyme && <Row label="Acronyme">{ptf.acronyme}</Row>}
            {ptf.type && <Row label="Type">{ptf.type.replace(/_/g, ' ')}</Row>}
            {ptf.pays && (
              <Row icon={<Globe className="w-4 h-4 text-teal-700" />} label="Pays">
                {ptf.pays}
              </Row>
            )}
            {ptf.contactNom && <Row label="Contact">{ptf.contactNom}</Row>}
            {ptf.contactEmail && <Row label="Email contact">{ptf.contactEmail}</Row>}
            {ptf.contactTel && <Row label="Téléphone">{ptf.contactTel}</Row>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-navy text-lg">Domaines d'intérêt déclarés</CardTitle>
        </CardHeader>
        <CardContent>
          {domaines.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Aucun domaine d'intérêt déclaré. Contactez la DU pour configurer votre périmètre.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {domaines.map((d: string) => (
                <Badge key={d} className="bg-teal/10 text-teal-800 border border-teal/30">
                  {d.replace(/_/g, ' ').toLowerCase()}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs italic text-gray-500 mt-4">
            Pour modifier vos domaines d'intérêt, contactez la Delivery Unit MTN :
            <a href="mailto:du@mtn.gouv.sn" className="ml-1 text-teal-700 hover:underline">du@mtn.gouv.sn</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-b-0">
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="md:col-span-2 font-medium text-gray-900">{children}</div>
    </div>
  );
}
