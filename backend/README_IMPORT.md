# 📊 IMPORT DES DONNÉES EXCEL - FLUX INTEROPÉRABILITÉ

Ce dossier contient les fichiers nécessaires pour importer les 46 flux d'interopérabilité du fichier Excel `Template_Identification_Flux_Interop_COMPLET.xlsx` dans la base de données PostgreSQL.

---

## 📦 FICHIERS FOURNIS

1. **flux_data.json** (46 KB)
   - Données extraites du fichier Excel
   - 46 flux d'interopérabilité
   - 61 institutions uniques
   - 60 systèmes uniques

2. **seed_flux_interop.ts** (13 KB)
   - Script TypeScript pour l'import dans Prisma
   - Normalisation des institutions
   - Création automatique des relations

3. **import_flux.sh**
   - Script bash automatique pour tout le processus
   - Vérifications + Import + Validation

---

## 🚀 INSTRUCTIONS D'IMPORT

### **Méthode 1 : Script automatique (Recommandé)**

```bash
# 1. Copier les fichiers dans votre projet backend
cd /chemin/vers/questionnaire-interop/backend

# Copier les 2 fichiers nécessaires
cp /chemin/vers/flux_data.json ./prisma/
cp /chemin/vers/seed_flux_interop.ts ./prisma/

# Copier le script d'import
cp /chemin/vers/import_flux.sh ./

# 2. Rendre le script exécutable
chmod +x import_flux.sh

# 3. Exécuter l'import
./import_flux.sh
```

### **Méthode 2 : Manuelle**

```bash
cd /chemin/vers/questionnaire-interop/backend

# 1. Copier les fichiers
cp /chemin/vers/flux_data.json ./prisma/
cp /chemin/vers/seed_flux_interop.ts ./prisma/

# 2. Vérifier la connexion DB
npx prisma db execute --stdin <<< "SELECT 1;"

# 3. Générer le client Prisma
npx prisma generate

# 4. Exécuter le seed
npx tsx prisma/seed_flux_interop.ts
```

---

## 📊 DONNÉES QUI SERONT IMPORTÉES

### **Institutions** (61 institutions uniques)

Les institutions principales :
- **MEF** : DGID, DGD, ANSD, DGCPT, DGF, DCAD, IPRES, DGM
- **Justice** : Greffe (RCCM), Centre National du Casier Judiciaire
- **Intérieur** : ANEC, DAF, DGE, Direction Police Frontières
- **Présidence** : DGPSN, ARCOP, BOCS, RNU
- **Santé** : MSAS, SEN-CSU, SIGICMU
- **Autres** : CSS, IPRES, MCTN, etc.

Chaque institution sera créée avec :
- Code unique
- Nom complet
- Ministère de tutelle
- Email générique : `pfi.<code>@gouv.sn`

### **Flux d'interopérabilité** (46 flux)

Exemples de flux importés :
- **XRN-CU-01** : Attribution et vérification NINEA (ANSD → DGID)
- **XRN-CU-02** : Vérification existence légale RCCM (Greffe → DGID/ANSD/DGD)
- **XRN-CU-03** : Vérification casier judiciaire (Justice → Greffe/DGID)
- **XRN-CU-04** : Diffusion NINEA vers Douane (ANSD → DGD)
- etc.

Chaque flux contient :
- Institution source et consommatrice
- Système source et cible
- Données échangées
- Fréquence (temps réel, batch, événementiel)
- Mode d'échange (X-Road, API, etc.)
- Base légale
- Niveau de sensibilité
- Mesures de sécurité
- SLA

### **Cas d'usage** (46 cas)

Exemples :
- Création d'entreprise (Triptyque NINEA-RCCM-Casier)
- Identification des opérateurs économiques
- Couverture sanitaire universelle
- Protection sociale
- Marchés publics
- etc.

### **Systèmes** (60 systèmes)

Exemples :
- **DGID** : SIGTAS, e-Tax, NINEAWEB
- **DGD** : GAINDE Integral, GAINDE 2000
- **Justice** : E-RCCM, Casier judiciaire dématérialisé
- **Santé** : SEN-CSU, SIGICMU
- etc.

---

## 📈 RÉSULTAT ATTENDU

Après l'import, vous aurez :

```
✅ ~60 institutions créées
✅ 1 soumission "template" (cartographie complète)
✅ 46 flux existants
✅ 46 cas d'usage
✅ ~60 applications/systèmes
```

---

## 🔍 VÉRIFICATION POST-IMPORT

### **Vérifier dans Prisma Studio**

```bash
npx prisma studio
```

Puis naviguer vers :
- **Institutions** → Vérifier les 60+ institutions
- **Submissions** → Voir la soumission "template"
- **FluxExistants** → Voir les 46 flux
- **CasUsage** → Voir les 46 cas d'usage
- **Applications** → Voir les ~60 systèmes

### **Vérifier en SQL**

```bash
# Compter les institutions
npx prisma db execute --stdin <<< "SELECT COUNT(*) as total FROM institutions;"

# Compter les flux
npx prisma db execute --stdin <<< "SELECT COUNT(*) as total FROM flux_existants;"

# Compter les cas d'usage
npx prisma db execute --stdin <<< "SELECT COUNT(*) as total FROM cas_usage;"

# Liste des institutions par ministère
npx prisma db execute --stdin <<< "SELECT ministere, COUNT(*) as total FROM institutions GROUP BY ministere ORDER BY total DESC;"
```

---

## 🎯 UTILISATION DANS L'APPLICATION

Une fois importées, les données seront :

1. **Visibles dans le frontend** :
   - Dashboard : Statistiques des flux
   - Page Institutions : Liste complète
   - Page Rapports : Matrices fournisseur/consommateur

2. **Exploitables via l'API** :
   - `GET /api/institutions` → Liste des 60+ institutions
   - `GET /api/submissions/:id` → Voir les flux
   - `GET /api/reports/generate` → Générer rapports

3. **Base pour nouveaux questionnaires** :
   - Les institutions existent déjà
   - Les utilisateurs pourront créer leurs soumissions
   - Référence pour identifier les flux existants

---

## 🛠️ TROUBLESHOOTING

### **Erreur : "Fichier flux_data.json introuvable"**

```bash
# Vérifier que le fichier est bien copié
ls -la prisma/flux_data.json

# Si absent, le recopier
cp /chemin/vers/flux_data.json ./prisma/
```

### **Erreur : "Cannot connect to database"**

```bash
# Vérifier que PostgreSQL tourne
docker ps | grep questionnaire-db

# Si pas démarré
cd .. && docker-compose up -d postgres

# Attendre 5 secondes puis réessayer
sleep 5 && ./import_flux.sh
```

### **Erreur : "Unique constraint violation"**

Cela signifie que certaines données existent déjà. Options :

**Option 1** : Nettoyer la base avant import
```bash
# ATTENTION : Ceci supprime TOUTES les données
npx prisma migrate reset --force
npx prisma migrate dev
./import_flux.sh
```

**Option 2** : Modifier le script pour skip les doublons (déjà implémenté)

Le script vérifie déjà l'existence avant de créer :
```typescript
// Le script check déjà si l'institution existe
let institution = await prisma.institution.findUnique({
  where: { code: normalized.code }
});

if (!institution) {
  // Créer seulement si n'existe pas
}
```

---

## 📝 NOTES IMPORTANTES

1. **Normalisation des institutions**
   - Les noms d'institutions sont normalisés automatiquement
   - Exemples : "ANSD", "ANSD (NINEA)" → même institution
   - Code généré : ANSD

2. **Données génériques**
   - Les contacts des institutions sont génériques (`pfi.<code>@gouv.sn`)
   - À mettre à jour manuellement après l'import
   - Via Prisma Studio ou l'interface admin

3. **Soumission template**
   - Une soumission spéciale "template" est créée
   - Status : VALIDATED
   - Contient tous les flux de la cartographie Excel
   - Sert de référence pour la plateforme PINS

4. **Pas de duplication**
   - Si vous relancez l'import, les institutions existantes ne seront pas dupliquées
   - Les flux/cas d'usage seront recréés (vérifier avant de relancer)

---

## 🎉 APRÈS L'IMPORT

1. **Vérifier les données dans Prisma Studio**
   ```bash
   npx prisma studio
   ```

2. **Mettre à jour les contacts réels**
   - Dans Prisma Studio ou via l'interface admin
   - Remplacer les emails génériques

3. **Tester l'application frontend**
   ```bash
   cd ../frontend
   npm run dev
   ```
   Puis aller sur : http://localhost:5173

4. **Générer un rapport de synthèse**
   - Via l'interface : `/reports`
   - Via l'API : `POST /api/reports/generate`

---

## 🔗 LIENS UTILES

- **Prisma Documentation** : https://www.prisma.io/docs
- **TypeScript** : https://www.typescriptlang.org/
- **PostgreSQL** : https://www.postgresql.org/docs/

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs de l'import
2. Consulter ce README
3. Vérifier la connexion à la base
4. Contacter le point focal technique

---

**🇸🇳 Fait pour SENUM - Plateforme PINS (X-Road Sénégal)**
