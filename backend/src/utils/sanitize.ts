/**
 * Assainissement des entrées utilisateur — défense en profondeur XSS.
 * La CSP bloque déjà les scripts inline ; cette couche nettoie les données
 * avant stockage pour éviter la persistance de HTML malveillant.
 */

const TAG_RE = /<[^>]*>/g;

/** Supprime toutes les balises HTML d'une chaîne. */
export function stripHtml(input: string): string {
  return input.replace(TAG_RE, '');
}

/** Nettoie une chaîne nullable. */
export function sanitizeString(input: string | null | undefined): string | null {
  if (input == null) return null;
  return stripHtml(input);
}

/** Nettoie un tableau de chaînes. */
export function sanitizeStringArray(input: string[] | null | undefined): string[] {
  if (!input) return [];
  return input.map(s => stripHtml(s));
}

/** Nettoie les champs texte d'un objet recensement. */
export function sanitizeRecensementInput(data: Record<string, any>): Record<string, any> {
  const textFields = [
    'ministereAutre', 'structureNom', 'contactNom', 'contactFonction',
    'contactEmail', 'contactTelephone', 'intitule', 'description',
    'sourceFinancementPrecision', 'echangeDonneesDetail',
    'observations', 'notesInternes',
  ];
  const arrayFields = ['natures', 'registresConcernes'];

  const cleaned = { ...data };
  for (const field of textFields) {
    if (typeof cleaned[field] === 'string') {
      cleaned[field] = stripHtml(cleaned[field]);
    }
  }
  for (const field of arrayFields) {
    if (Array.isArray(cleaned[field])) {
      cleaned[field] = cleaned[field].map((s: string) => (typeof s === 'string' ? stripHtml(s) : s));
    }
  }
  return cleaned;
}
