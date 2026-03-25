# 🎯 GUIDE RAPIDE - IMPORT DES DONNÉES EXCEL

**Date** : 6 mars 2026  
**Fichier source** : `Template_Identification_Flux_Interop_COMPLET.xlsx`  
**Projet** : Questionnaire Interopérabilité SENUM

---

## ✅ CE QUI A ÉTÉ FAIT

J'ai analysé votre fichier Excel et créé **4 fichiers** pour importer automatiquement toutes les données dans la base PostgreSQL :

### **📊 Données extraites du fichier Excel**

- ✅ **46 flux d'interopérabilité** complets
- ✅ **61 institutions** uniques identifiées
- ✅ **60 systèmes/applications** uniques
- ✅ **46 cas d'usage** détaillés

Toutes les 19 colonnes ont été préservées :
- ID Flux, Cas d'usage, Processus métier
- Institutions source/consommatrice
- Systèmes source/cible
- Données échangées, Fréquence, Mode d'échange
- Base légale, Niveau de sensibilité
- Mesures de sécurité, SLA, Statut
- etc.

---

## 📦 FICHIERS CRÉÉS (4)

### **1. flux_data.json** (46 KB)
Données JSON extraites du fichier Excel.
- 46 flux avec toutes les métadonnées
- Prêt pour l'import

### **2. seed_flux_interop.ts** (13 KB)
Script TypeScript Prisma pour l'import automatique.
- Normalisation intelligente des institutions
- Gestion des doublons
- Création de toutes les relations

### **3. import_flux.sh**
Script bash automatique clé en main.
- Vérifie la connexion DB
- Exécute l'import
- Affiche les statistiques

### **4. README_IMPORT.md**
Documentation complète avec :
- Instructions d'utilisation
- Troubleshooting
- Vérifications post-import

---

## 🚀 UTILISATION EN 3 ÉTAPES

### **Étape 1 : Copier les fichiers dans votre projet**

```bash
# Depuis Windows (votre projet est dans F:\Moi\MCTN\Interco\DPI-INTEROP)
cd F:\Moi\MCTN\Interco\DPI-INTEROP\questionnaire-interop\backend

# Copier les 2 fichiers de données
copy C:\chemin\vers\flux_data.json .\prisma\
copy C:\chemin\vers\seed_flux_interop.ts .\prisma\

# Copier le script d'import
copy C:\chemin\vers\import_flux.sh .\
```

**OU** télécharger les fichiers depuis Claude et les placer manuellement :
- `flux_data.json` → `backend/prisma/`
- `seed_flux_interop.ts` → `backend/prisma/`
- `import_flux.sh` → `backend/`

### **Étape 2 : Exécuter l'import**

```bash
# Sur Windows avec Git Bash ou WSL
cd backend
chmod +x import_flux.sh
./import_flux.sh
```

**OU en manuel** :
```bash
cd backend
npx prisma generate
npx tsx prisma/seed_flux_interop.ts
```

### **Étape 3 : Vérifier les résultats**

```bash
# Ouvrir Prisma Studio
npx prisma studio

# Naviguer vers :
# - Institutions (devrait afficher ~65 institutions)
# - Submissions (1 soumission "template")
# - FluxExistants (46 flux)
# - CasUsage (46 cas d'usage)
```

---

## 📊 RÉSULTAT ATTENDU

Après l'import, votre base de données contiendra :

```
✅ ~65 institutions
   (5 existantes + 60 nouvelles du fichier Excel)

✅ 1 soumission "template"
   Status: VALIDATED
   Contient tous les flux de la cartographie

✅ 46 flux d'interopérabilité
   Avec toutes les métadonnées (source, destination, mode, etc.)

✅ 46 cas d'usage
   Liés aux flux correspondants

✅ ~60 systèmes/applications
   SIGTAS, NINEAWEB, GAINDE, E-RCCM, etc.
```

---

## 🎯 INSTITUTIONS PRINCIPALES IMPORTÉES

Le script va créer/identifier ces institutions :

**Ministère de l'Économie et des Finances (MEF)**
- DGID - Direction Générale des Impôts et des Domaines
- DGD - Direction Générale des Douanes
- ANSD - Agence Nationale de la Statistique et de la Démographie
- DGCPT - Direction Générale de la Comptabilité Publique et du Trésor
- DGF - Direction Générale des Finances
- DCAD - Direction du Cadastre
- IPRES - Institution de Prévoyance Retraite
- DGM - Direction Générale de la Microfinance

**Ministère de l'Intérieur**
- ANEC - Agence Nationale de l'État Civil
- DAF - Direction de l'Automatisation des Fichiers
- DGE - Direction Générale des Elections
- DPF - Direction de la Police des Frontières

**Ministère de la Justice**
- GREFFE - Greffe du Tribunal de Commerce (RCCM)
- CNCJ - Centre National du Casier Judiciaire

**Présidence**
- DGPSN - Délégation Générale à la Protection Sociale
- RNU - Registre National Unique
- ARCOP - Autorité de Régulation de la Commande Publique
- BOCS - Bureau Opérationnel de Coordination et de Suivi

**Santé et Social**
- MSAS - Ministère de la Santé et de l'Action Sociale
- SEN-CSU - Couverture Sanitaire Universelle
- SIGICMU - Système Intégré de Gestion CMU

**Autres**
- CSS - Caisse de Sécurité Sociale
- MCTN - Ministère Communication et Économie Numérique
- MAER - Ministère de l'Agriculture
- MESRI - Ministère de l'Enseignement Supérieur
- etc.

---

## 💡 EXEMPLES DE FLUX IMPORTÉS

Voici quelques flux clés qui seront dans votre base :

**XRN-CU-01 : Attribution et vérification NINEA**
- Source : ANSD (NINEAWEB)
- Destination : DGID (SIGTAS)
- Mode : X-Road
- Priorité : Phase 2 - Triptyque (Priorité 1)

**XRN-CU-02 : Vérification existence légale (RCCM)**
- Source : Ministère de la Justice (E-RCCM)
- Destinations : DGID, ANSD, DGD
- Mode : X-Road
- Priorité : Phase 2 - Triptyque (Priorité 1)

**XRN-CU-03 : Vérification casier judiciaire**
- Source : Centre National du Casier Judiciaire
- Destinations : Greffe (RCCM), DGID
- Mode : X-Road
- Sensibilité : Élevée
- Priorité : Phase 2 - Triptyque (Priorité 1)

**XRN-CU-04 : Diffusion NINEA vers Douane**
- Source : ANSD (NINEAWEB)
- Destination : DGD (GAINDE Integral)
- Mode : X-Road
- Fréquence : Temps réel

... et 42 autres flux !

---

## 🔍 VÉRIFICATIONS POST-IMPORT

### **1. Via Prisma Studio (Interface graphique)**

```bash
npx prisma studio
```

Puis naviguez pour vérifier :
- Institutions → Environ 65 institutions
- Submissions → 1 soumission template
- FluxExistants → 46 flux
- CasUsage → 46 cas d'usage
- Applications → ~60 systèmes

### **2. Via SQL (Ligne de commande)**

```bash
# Compter les institutions
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM institutions;"

# Institutions par ministère
npx prisma db execute --stdin <<< "
SELECT ministere, COUNT(*) as total 
FROM institutions 
GROUP BY ministere 
ORDER BY total DESC;
"

# Liste des flux
npx prisma db execute --stdin <<< "
SELECT source, destination, mode 
FROM flux_existants 
LIMIT 10;
"
```

### **3. Via l'API Backend**

Si votre backend tourne (port 3000) :

```bash
# Liste des institutions
curl http://localhost:3000/api/institutions

# Détails de la soumission template
curl http://localhost:3000/api/submissions
```

### **4. Via le Frontend**

Si votre frontend tourne (port 5173) :
- Ouvrir http://localhost:5173
- Se connecter (admin@senum.sn / Admin@2026)
- Aller dans "Institutions" → Voir les 65 institutions
- Aller dans "Soumissions" → Voir la soumission template
- Aller dans "Rapports" → Générer une matrice des flux

---

## ⚠️ NOTES IMPORTANTES

1. **Normalisation automatique**
   - Les noms d'institutions sont normalisés (ex: "ANSD", "ANSD (NINEA)" → même institution)
   - Les codes sont générés automatiquement (DGID, DGD, ANSD, etc.)

2. **Contacts génériques**
   - Les emails sont générés : `pfi.<code>@gouv.sn`
   - Les téléphones sont : `+221 33 XXX XX XX`
   - À mettre à jour manuellement après l'import

3. **Pas de duplication**
   - Le script vérifie si une institution existe déjà (par code)
   - Si existe → skip
   - Si n'existe pas → création

4. **Soumission template**
   - Une soumission spéciale est créée
   - Institution : ANSD
   - Status : VALIDATED
   - Contient tous les flux de la cartographie Excel

---

## 🛠️ TROUBLESHOOTING

### **Problème : PostgreSQL ne répond pas**

```bash
# Vérifier que Docker tourne
docker ps

# Si le container n'existe pas, le démarrer
cd ..
docker-compose up -d postgres

# Attendre 5 secondes
sleep 5

# Réessayer l'import
cd backend
./import_flux.sh
```

### **Problème : "Fichier introuvable"**

Vérifier que les fichiers sont bien copiés :

```bash
ls -la prisma/flux_data.json
ls -la prisma/seed_flux_interop.ts
```

Si absent, les recopier depuis les téléchargements.

### **Problème : "Unique constraint violation"**

Cela signifie que certaines données existent déjà.

**Solution** : Réinitialiser la base (⚠️ supprime TOUT)

```bash
npx prisma migrate reset --force
npx prisma migrate dev
./import_flux.sh
```

---

## 🎉 APRÈS L'IMPORT - PROCHAINES ÉTAPES

1. **Mettre à jour les contacts réels**
   - Dans Prisma Studio : `npx prisma studio`
   - Ou via l'interface admin
   - Remplacer les emails/tél génériques

2. **Créer des utilisateurs pour les institutions**
   ```sql
   INSERT INTO users (email, password, role, institution_id)
   VALUES ('dsi@dgid.sn', '<hash>', 'INSTITUTION', '<dgid_id>');
   ```

3. **Tester le frontend**
   ```bash
   cd ../frontend
   npm run dev
   ```

4. **Générer des rapports**
   - Via l'interface : http://localhost:5173/reports
   - Matrice fournisseur/consommateur
   - Export CSV/JSON

---

## 📞 BESOIN D'AIDE ?

Si vous rencontrez un problème :

1. Vérifier les logs de l'import
2. Consulter le README_IMPORT.md complet
3. Vérifier que PostgreSQL tourne
4. Vérifier les variables d'environnement (.env)

---

**🚀 PRÊT À IMPORTER VOS DONNÉES !**

**Téléchargez les 4 fichiers ci-dessus et suivez les 3 étapes. C'est tout ! 🇸🇳**
