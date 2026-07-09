import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { Loader2, Coins, Heart, Save, Send, X } from 'lucide-react';

const DEVISES = ['XOF', 'EUR', 'USD'] as const;
const INSTRUMENTS = [
  { value: 'DON', label: 'Don' },
  { value: 'PRET_CONCESSIONNEL', label: 'Prêt concessionnel' },
  { value: 'PRET_SOUVERAIN', label: 'Prêt souverain' },
  { value: 'ASSISTANCE_TECHNIQUE', label: 'Assistance technique' },
  { value: 'MIXTE', label: 'Mixte' },
];

const baseSchema = z.object({
  type: z.enum(['INTERET', 'FINANCEMENT']),
  commentaire: z
    .string()
    .min(200, 'Le commentaire doit faire au moins 200 caractères')
    .max(2000, 'Le commentaire ne peut pas dépasser 2000 caractères'),
  fenetreTemporelle: z
    .string()
    .max(80, 'Maximum 80 caractères')
    .optional()
    .or(z.literal('')),
  montantEstime: z.string().optional().or(z.literal('')),
  devise: z.enum(DEVISES).optional(),
  instrumentFinancier: z
    .enum(['DON', 'PRET_CONCESSIONNEL', 'PRET_SOUVERAIN', 'ASSISTANCE_TECHNIQUE', 'MIXTE'])
    .optional(),
});

const schema = baseSchema.superRefine((val, ctx) => {
  if (val.type === 'FINANCEMENT') {
    const n = parseFloat(val.montantEstime || '');
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({ code: 'custom', path: ['montantEstime'], message: 'Montant requis (> 0)' });
    }
    if (!val.devise) {
      ctx.addIssue({ code: 'custom', path: ['devise'], message: 'Devise requise' });
    }
    if (!val.instrumentFinancier) {
      ctx.addIssue({ code: 'custom', path: ['instrumentFinancier'], message: 'Instrument financier requis' });
    }
  }
});

type FormValues = z.infer<typeof schema>;

interface ManifestationFormProps {
  casUsageId: string;
  casCode?: string;
  casTitre?: string;
  /** Manifestation existante à charger en édition (DRAFT uniquement) */
  manifestationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ManifestationForm({
  casUsageId,
  casCode,
  casTitre,
  manifestationId,
  onSuccess,
  onCancel,
}: ManifestationFormProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Profil PTF pour afficher le point focal (contactNom, contactEmail)
  const { data: profil } = useQuery({
    queryKey: ['partenaire-profil'],
    queryFn: () => api.get('/partenaire/profil').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Manifestation existante (édition DRAFT)
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['partenaire-manifestation', manifestationId],
    queryFn: () => api.get(`/partenaire/manifestations/${manifestationId}`).then((r) => r.data),
    enabled: !!manifestationId,
  });

  const defaultValues = useMemo<FormValues>(() => {
    if (existing) {
      return {
        type: existing.type,
        commentaire: existing.commentaire || '',
        fenetreTemporelle: existing.fenetreTemporelle || '',
        montantEstime: existing.montantEstime != null ? String(existing.montantEstime) : '',
        devise: existing.devise || undefined,
        instrumentFinancier: existing.instrumentFinancier || undefined,
      };
    }
    return {
      type: 'INTERET',
      commentaire: '',
      fenetreTemporelle: '',
      montantEstime: '',
      devise: undefined,
      instrumentFinancier: undefined,
    };
  }, [existing]);

  const {
    register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues,
  });

  const type = watch('type');
  const commentaireValue = watch('commentaire') || '';
  const fenetreValue = watch('fenetreTemporelle') || '';

  const saveDraft = useMutation({
    mutationFn: async (payload: FormValues) => {
      const body = buildPayload(casUsageId, payload);
      if (manifestationId) {
        return api.put(`/partenaire/manifestations/${manifestationId}`, body).then((r) => r.data);
      }
      return api.post('/partenaire/manifestations', { ...body, casUsageId }).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partenaire-manifestations'] });
      qc.invalidateQueries({ queryKey: ['partenaire-manifestation-cas', casUsageId] });
      toast({ title: 'Brouillon enregistré', description: 'Vous pourrez le modifier puis le soumettre quand vous serez prêt.' });
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors de l\'enregistrement';
      toast({ variant: 'destructive', title: 'Échec de l\'enregistrement', description: msg });
    },
  });

  const submitFinal = useMutation({
    mutationFn: async (payload: FormValues) => {
      const body = buildPayload(casUsageId, payload);
      let id = manifestationId;
      if (id) {
        await api.put(`/partenaire/manifestations/${id}`, body);
      } else {
        const created = await api.post('/partenaire/manifestations', { ...body, casUsageId }).then((r) => r.data);
        id = created.id;
      }
      return api.post(`/partenaire/manifestations/${id}/submit`).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partenaire-manifestations'] });
      qc.invalidateQueries({ queryKey: ['partenaire-manifestation-cas', casUsageId] });
      toast({
        title: 'Manifestation soumise',
        description: 'Votre manifestation a été transmise à la Delivery Unit MTN pour validation.',
      });
      reset();
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors de la soumission';
      toast({ variant: 'destructive', title: 'Échec de la soumission', description: msg });
    },
  });

  if (manifestationId && loadingExisting) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
      </div>
    );
  }

  const onSaveDraft = handleSubmit((v) => saveDraft.mutate(v));
  const onSubmitFinal = handleSubmit((v) => submitFinal.mutate(v));

  const ptf = profil?.ptf;
  const isBusy = saveDraft.isPending || submitFinal.isPending || isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-navy text-lg flex items-center gap-2">
          <Coins className="w-5 h-5 text-gold" />
          {manifestationId ? 'Modifier ma manifestation' : 'Déposer une manifestation d\'intérêt'}
        </CardTitle>
        {casCode && (
          <div className="text-xs text-gray-500">
            Cas d'usage&nbsp;
            <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{casCode}</span>
            {casTitre && <> — {casTitre}</>}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Identité du PTF (read-only, depuis profil) */}
        <div className="rounded-md border border-teal/20 bg-teal/5 p-3 text-xs space-y-1">
          <p className="font-semibold text-teal-800">Identité de votre organisation (read-only)</p>
          <p><span className="text-gray-500">PTF :</span> <b>{ptf?.nom}</b> {ptf?.code && <span className="text-gray-400">({ptf.code})</span>}</p>
          {ptf?.contactNom && <p><span className="text-gray-500">Point focal PTF :</span> {ptf.contactNom}</p>}
          {ptf?.contactEmail && <p><span className="text-gray-500">Email :</span> {ptf.contactEmail}</p>}
          <p className="italic text-gray-500 mt-1">
            Pour modifier ces informations, contactez la DU MTN.
          </p>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Type de manifestation</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <TypeChoice
              label="Intérêt"
              icon={<Heart className="w-4 h-4" />}
              description="Intention de positionnement sans engagement financier"
              checked={type === 'INTERET'}
              onClick={() => setValue('type', 'INTERET', { shouldValidate: true })}
            />
            <TypeChoice
              label="Financement"
              icon={<Coins className="w-4 h-4" />}
              description="Proposition de financement chiffrée"
              checked={type === 'FINANCEMENT'}
              onClick={() => setValue('type', 'FINANCEMENT', { shouldValidate: true })}
            />
          </div>
        </div>

        {/* Champs FINANCEMENT */}
        {type === 'FINANCEMENT' && (
          <div className="space-y-4 rounded-md border border-gold/30 bg-gold/5 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="montantEstime">Montant estimé *</Label>
                <Input
                  id="montantEstime"
                  type="number"
                  min="0"
                  step="any"
                  {...register('montantEstime')}
                  placeholder="ex: 2500000"
                  disabled={isBusy}
                />
                {errors.montantEstime && <p className="text-xs text-red-600 mt-1">{errors.montantEstime.message}</p>}
              </div>
              <div>
                <Label>Devise *</Label>
                <Select
                  value={watch('devise')}
                  onValueChange={(v) => setValue('devise', v as any, { shouldValidate: true })}
                  disabled={isBusy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVISES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.devise && <p className="text-xs text-red-600 mt-1">{errors.devise.message as string}</p>}
              </div>
              <div>
                <Label>Instrument financier *</Label>
                <Select
                  value={watch('instrumentFinancier')}
                  onValueChange={(v) => setValue('instrumentFinancier', v as any, { shouldValidate: true })}
                  disabled={isBusy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS.map((i) => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.instrumentFinancier && <p className="text-xs text-red-600 mt-1">{errors.instrumentFinancier.message as string}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Fenêtre temporelle */}
        <div>
          <Label htmlFor="fenetreTemporelle">Fenêtre temporelle envisagée (optionnel)</Label>
          <Input
            id="fenetreTemporelle"
            {...register('fenetreTemporelle')}
            placeholder="ex: S2 2026, Q1 2027, courant 2027..."
            disabled={isBusy}
            maxLength={80}
          />
          <p className="text-xs text-gray-500 mt-1">
            Indication du calendrier prévisionnel sous lequel votre organisation pourrait s'engager
            ({fenetreValue.length}/80).
          </p>
        </div>

        {/* Commentaire */}
        <div>
          <Label htmlFor="commentaire">
            Description de votre manifestation <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id="commentaire"
            rows={8}
            {...register('commentaire')}
            placeholder="Décrivez : la motivation de votre PTF pour ce cas d'usage, l'alignement avec votre stratégie pays, les conditions préalables, les co-financements éventuels, le contact technique référent..."
            disabled={isBusy}
          />
          <div className="flex justify-between mt-1">
            {errors.commentaire ? (
              <p className="text-xs text-red-600">{errors.commentaire.message}</p>
            ) : (
              <p className="text-xs text-gray-500">200 caractères minimum, 2000 maximum</p>
            )}
            <p className={`text-xs ${commentaireValue.length < 200 ? 'text-amber-600' : 'text-teal-700'}`}>
              {commentaireValue.length} / 2000
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 italic">
            <Badge variant="outline" className="mr-1">Brouillon</Badge>
            modifiable avant soumission. Une fois soumise, la manifestation passe en validation DU.
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isBusy}>
                <X className="w-4 h-4 mr-1" /> Annuler
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={isBusy}
              className="border-teal/40 text-teal-800 hover:bg-teal/10"
            >
              {saveDraft.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Enregistrer brouillon
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSubmitFinal}
              disabled={isBusy}
              className="bg-gold hover:bg-gold/90 text-white"
            >
              {submitFinal.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Soumettre à la DU
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildPayload(_casUsageId: string, v: FormValues) {
  const payload: any = {
    type: v.type,
    commentaire: v.commentaire,
    fenetreTemporelle: v.fenetreTemporelle || null,
  };
  if (v.type === 'FINANCEMENT') {
    payload.montantEstime = parseFloat(v.montantEstime || '0');
    payload.devise = v.devise;
    payload.instrumentFinancier = v.instrumentFinancier;
  }
  return payload;
}

function TypeChoice({
  label, description, icon, checked, onClick,
}: { label: string; description: string; icon: React.ReactNode; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border p-3 transition-colors ${
        checked
          ? 'border-teal-700 bg-teal/10 ring-2 ring-teal/30'
          : 'border-gray-200 bg-white hover:border-teal/40'
      }`}
    >
      <div className="flex items-center gap-2 text-navy font-medium">
        {icon}
        {label}
      </div>
      <p className="text-xs text-gray-600 mt-1">{description}</p>
    </button>
  );
}
