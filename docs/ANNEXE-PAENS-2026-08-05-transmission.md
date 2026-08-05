# Annexe technique — Lot pilote des administrations financières

**Réf : MTN/DU/PINS/NOTE-2026-08-05**  
**Objet :** Annexe technique — échanges de données du lot pilote, à destination du dimensionnement de l'infrastructure.  
**Date :** 2026-08-05  
**Extraction :** base PINS, lecture seule. 38 cas, aucun chiffre reconstitué.

---

**15 cas qualifiés** (pilotage macroéconomique, SENTAX, SFD) + **23 cas priorisés** (boucle liquidative fiscalo-douanière, référentiels pivots). Aucun cas en production.

| # | Code | Intitulé | Gouvernance | Domaine | Institutions (rôle) | Registres | Systèmes source | Dép. techniques |
|---|------|----------|-------------|---------|---------------------|-----------|-----------------|-----------------|
| 1 | PINS-METIER-560 | Tableau de bord macroéconomique temps réel | QUALIFIE | FINANCES_PUBLIQUES | ANSD (Cons); DGCPT (Fourn); DGD (Fourn); DGID (Fourn); MFB (Cons) | SIGIF (C) | — | PINS-TECH-3010, PINS-TECH-3011 |
| 2 | PINS-METIER-561 | Suivi temps réel de l'exécution du PRES | QUALIFIE | FINANCES_PUBLIQUES | MEPC (Init); MEPC (Cons); MFB (Cons) | SIGIF (C) | — | PINS-TECH-3012, PINS-TECH-3013 |
| 3 | PINS-METIER-562 | Production accélérée des comptes nationaux | QUALIFIE | FINANCES_PUBLIQUES | ANSD (Cons); DGCPT (Fourn); DGD (Fourn); DGID (Fourn) | SIGIF (C) | — | PINS-TECH-3014 |
| 4 | PINS-METIER-563 | Coordination temps réel de l'aide internationale | QUALIFIE | FINANCES_PUBLIQUES | DCEF (Fourn); MFB (Cons) | ⚠️ AUCUN | — | PINS-TECH-3015, PINS-TECH-3016 |
| 5 | PINS-METIER-564 | Signaux faibles et alertes macroéconomiques | QUALIFIE | FINANCES_PUBLIQUES | ANSD (Cons); DGCPT (Fourn); DGD (Fourn); DGID (Fourn); MEPC (Init); MFB (Cons) | ⚠️ AUCUN | — | PINS-TECH-3010, PINS-TECH-3011, PINS-TECH-3012, PINS-TECH-3013, PINS-TECH-3017 |
| 6 | PINS-PROP-TECH-0001 | SENTAX.TransmettreRolesEtPrisesEnCharge | QUALIFIE | FINANCES_PUBLIQUES | DGCPT (Cons); DGID (Fourn) | ASTER (A); NOMENCLATURE-FISCALE (C); SENTAX (C) | SIGTAS | — |
| 7 | PINS-TECH-3010 | ANSD.GetIndicateursConjoncturels | QUALIFIE | FINANCES_PUBLIQUES | ANSD (Fourn) | ⚠️ AUCUN | — | — |
| 8 | PINS-TECH-3011 | BCEAO.GetIndicateursMonetaires | QUALIFIE | FINANCES_PUBLIQUES | BCEAO (Fourn) | ⚠️ AUCUN | — | — |
| 9 | PINS-TECH-3012 | Ministeres.PushIndicateursPRES | QUALIFIE | FINANCES_PUBLIQUES | MEPC (Cons); MFB (Cons) | ⚠️ AUCUN | — | — |
| 10 | PINS-TECH-3013 | Budget.GetExecutionParMesurePRES | QUALIFIE | FINANCES_PUBLIQUES | ANSD (Cons); MFB (Fourn) | SIGIF (C) | — | — |
| 11 | PINS-TECH-3014 | Sectoriels.GetIndicateursActivite | QUALIFIE | FINANCES_PUBLIQUES | ANSD (Cons) | ⚠️ AUCUN | — | — |
| 12 | PINS-TECH-3015 | DCEF.GetEngagementsBailleurs | QUALIFIE | FINANCES_PUBLIQUES | DCEF (Fourn) | ⚠️ AUCUN | — | — |
| 13 | PINS-TECH-3016 | DCEF.GetDecaissementsParProjet | QUALIFIE | FINANCES_PUBLIQUES | DCEF (Fourn) | ⚠️ AUCUN | — | — |
| 14 | PINS-TECH-3017 | MEPC.PushAlertesMacroeconomiques | QUALIFIE | FINANCES_PUBLIQUES | MEPC (Fourn) | ⚠️ AUCUN | — | — |
| 15 | PINS-TECH-5058 | DRS-SFD.VerifierAgrementSFD | QUALIFIE | FINANCES_PUBLIQUES | DRS-SFD (Fourn) | NOMENCLATURE-FISCALE (C); REG-ASSOC (C) | — | — |
| 16 | PINS-METIER-550 | Réconciliation fiscalo-douanière DGD ↔ DGID | PRIORISE | FINANCES_PUBLIQUES | ANSD (Fourn); DGD (Cons); DGID (Cons); MJ (Fourn) | GAINDE (C); NINEA (C); RCCM (C); REG-CASIER (C); SENTAX (C) | GAINDE-INTEGRAL, NINEA-WEB, ORBUS, SIGNAS, SIGTAS | PINS-TECH-0002, PINS-TECH-0027, PINS-TECH-0050 |
| 17 | PINS-METIER-551 | Cycle Liquidation → Recouvrement → Mainlevée (BAE) | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Cons); DGD (Fourn); DGID (Cons) | ASTER (A); GAINDE (C); SENTAX (A) | GAINDE-INTEGRAL, SIGTAS | PINS-TECH-0015, PINS-TECH-0302 |
| 18 | PINS-METIER-552 | Notification des encaissements et quittances Trésor → DGID | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Fourn); DGID (Cons) | ASTER (C); SENTAX (A) | SIGTAS | PINS-TECH-0009, PINS-TECH-0012, PINS-TECH-0014, PINS-TECH-0111, PINS-TECH-0112 |
| 19 | PINS-METIER-609 | Vérification du NIN | PRIORISE | IDENTITE_NUMERIQUE | DAF (Fourn); DGID (Cons) | REG-NIN (C) | — | PINS-TECH-5043 |
| 20 | PINS-METIER-610 | Preuve de vie | PRIORISE | IDENTITE_NUMERIQUE | CSS (Cons); DAF (Fourn); DGCPT (Cons); IPRES (Cons) | RNEC (C) | — | PINS-TECH-0055, PINS-TECH-5043, PINS-TECH-5047 |
| 21 | PINS-METIER-613 | Vérification et récupération des informations d'une entreprise via le NINEA | PRIORISE | CLIMAT_AFFAIRES | ANSD (Fourn); DGD (Cons); DGID (Cons) | NINEA (C) | NINEA-WEB | PINS-TECH-5001 |
| 22 | PINS-METIER-615 | Suivi de la TVA suspendue | PRIORISE | CLIMAT_AFFAIRES | APIX (Cons); DGD (Cons); DGID (Fourn) | NINEA (C); SENTAX (C) | NINEA-WEB, SIGTAS | PINS-TECH-0005, PINS-TECH-0032, PINS-TECH-0060, PINS-TECH-5001 |
| 23 | PINS-TECH-0002 | Consultation des declarations douanieres via Douanes.GetDeclarations | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Cons); DGD (Fourn); DGID (Cons) | GAINDE (C); NINEA (C); NOMENCLATURE-FISCALE (C) | GAINDE-INTEGRAL, NINEA-WEB | — |
| 24 | PINS-TECH-0004 | Consultation NINEA pour controles inter-administrations | PRIORISE | FINANCES_PUBLIQUES | ANSD (Init); ANSD (Fourn); APIX (Cons); ARCOP (Cons); CSS (Cons); DGCPT (Cons); DGD (Cons); DGID (Co | NINEA (C) | NINEA-WEB | — |
| 25 | PINS-TECH-0014 | Transmission des quittances du Tresor vers la DGID | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Init); DGCPT (Fourn); DGID (Cons) | ASTER (C); NOMENCLATURE-FISCALE (C); SENTAX (A) | SIGTAS | — |
| 26 | PINS-TECH-0015 | Transmission de l etat des recouvrements du Tresor vers les Douanes | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Init); DGCPT (Fourn); DGD (Cons) | ASTER (C); GAINDE (A) | GAINDE-INTEGRAL | — |
| 27 | PINS-TECH-0051 | Réconciliation recettes douanières-trésor | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Cons); DGCPT (PP); DGD (Fourn); DGID (Init); DGID (Cons) | ASTER (C); GAINDE (C); NINEA (C) | GAINDE-INTEGRAL, NINEA-WEB | — |
| 28 | PINS-TECH-0056 | Notification de paiement / encaissement DGCPT | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Fourn); DGD (Cons); DGID (Cons) | ASTER (C); SENTAX (A) | SIGTAS | — |
| 29 | PINS-TECH-2001 | Douanes.GetDeclarationsDouanieres | PRIORISE | FINANCES_PUBLIQUES | DGD (Fourn) | GAINDE (C) | GAINDE-INTEGRAL | — |
| 30 | PINS-TECH-2002 | Impots.GetDeclarationsFiscales | PRIORISE | FINANCES_PUBLIQUES | DGID (Fourn) | SENTAX (C) | SIGTAS | — |
| 31 | PINS-TECH-2003 | Impots.GetContribuablesCGE | PRIORISE | FINANCES_PUBLIQUES | DGID (Fourn) | SENTAX (C) | SIGTAS | — |
| 32 | PINS-TECH-2004 | Douanes.GetContribuablesActifs | PRIORISE | FINANCES_PUBLIQUES | DGD (Fourn) | GAINDE (C) | GAINDE-INTEGRAL | — |
| 33 | PINS-TECH-2005 | Douanes.PushDeclarationLiquidee | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Cons); DGD (Fourn); DGID (Cons) | ASTER (A); GAINDE (C) | GAINDE-INTEGRAL | — |
| 34 | PINS-TECH-2006 | Tresor.ValiderPaiement | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Fourn); DGD (Cons) | ASTER (C); GAINDE (A) | GAINDE-INTEGRAL | — |
| 35 | PINS-TECH-2007 | Tresor.PushQuittance | PRIORISE | FINANCES_PUBLIQUES | DGCPT (Fourn); DGID (Cons) | ASTER (C); SENTAX (A) | SIGTAS | — |
| 36 | PINS-TECH-2008a | Impots.GetAttestationImposition | PRIORISE | FINANCES_PUBLIQUES | DGID (Fourn) | SENTAX (C) | SIGTAS | — |
| 37 | PINS-TECH-2008b | Impots.GetConformiteFiscale | PRIORISE | FINANCES_PUBLIQUES | DGID (Fourn) | SENTAX (C) | SIGTAS | — |
| 38 | PINS-TECH-2008c | Impots.GetSituationFiscaleDetaillee | PRIORISE | FINANCES_PUBLIQUES | DGID (Fourn) | SENTAX (C) | SIGTAS | — |

**Légende rôles :** Init=Initiateur, Fourn=Fournisseur, Cons=Consommateur, PP=Partie prenante.  
**Légende modes :** C=Consomme, A=Alimente, CR=Crée.

## Notes

**9 cas sans registre lié** (PINS-METIER-563, 564, PINS-TECH-3010 à 3017) : chaîne « pilotage macroéconomique temps réel ». Les registres sous-jacents (SIGIF, indicateurs ANSD, balances BCEAO) ne sont pas encore câblés dans la relation structurée entre cas d'usage et registres nationaux.

**16 cas sans système source identifié** : les registres nationaux associés à ces cas ne sont pas encore reliés à un système d'information dans le référentiel des systèmes sources. Les 7 systèmes du périmètre MVP 2.0 (GUICHET-UNIQUE-APIX, ORBUS, NINEA-WEB, SIGNAS, SIGTAS, GAINDE-INTEGRAL, NDAMLI) couvrent une partie des registres du lot pilote.

**Fusions :** aucun des cas fusionnés (PINS-METIER-101→550, 102→551, 501→001) ne figurait dans le lot pilote. Le compte de 38 est inchangé.
