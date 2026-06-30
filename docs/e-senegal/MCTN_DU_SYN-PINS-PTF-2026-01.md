# SYNTHÈSE EXÉCUTIVE

## Module Partenaires Techniques et Financiers (PTF) sur la plateforme PINS

**Référence** : MCTN/DU/SYN-PINS-PTF-2026-01
**Pour** : M. DIABY, M. Moctar, décideurs MCTN
**Auteur** : Birama DIOP, PFNI MCTN/SENUM SA
**Date** : 13 mai 2026
**Document de référence** : note de cadrage complète v0.3 (30 pages)

---

## 1. CONTEXTE

La plateforme PINS, opérée par SENUM SA sous pilotage MCTN, recense aujourd'hui 213 institutions, 86 utilisateurs et 76 cas d'usage d'interopérabilité. Elle s'apprête à entrer dans une nouvelle phase de maturité en s'ouvrant aux Partenaires Techniques et Financiers (PTF) — bailleurs, agences de coopération, fondations, institutions multilatérales — pour coordonner les appuis extérieurs à la transformation numérique du Sénégal.

L'atelier stratégique du 19 mai 2026, réunissant Présidence, Primature, ministères clés et principaux PTF (Banque Mondiale, GIZ, JICA, Fondation Gates), constitue un moment privilégié pour positionner PINS comme l'outil de coordination de référence pour ces appuis.

## 2. ENJEU

Sans outil partagé, la coordination entre PTF et MCTN repose sur des réunions ad hoc et la mémoire des points focaux, ce qui génère des chevauchements (deux PTF sur le même cas), des lacunes (cas prioritaires sans appui) et des doublons. Le module PTF de PINS vise à :

- donner au MCTN une vue consolidée des engagements PTF par cas, par domaine et par partenaire ;
- offrir aux PTF un portefeuille validé par l'État sur lequel s'aligner, dans le respect des principes de souveraineté ;
- détecter en amont les chevauchements et les lacunes pour optimiser l'allocation des appuis.

## 3. ARCHITECTURE PROPOSÉE

L'architecture s'inscrit en continuité du stack technique PINS (PostgreSQL, Fastify, React) et introduit :

- un nouveau rôle utilisateur BAILLEUR (libellé "Partenaire Technique et Financier" en interface) ;
- trois nouvelles tables : domaines d'intérêt par PTF, manifestations d'intérêt, journal d'audit ;
- un référentiel normalisé de 14 domaines (finances publiques, santé numérique, identité, foncier, agriculture, et autres) ;
- une Vue 360° partenaire à 3 niveaux de classification, distincte de la Vue 360° institutionnelle ;
- un workflow de validation MCTN obligatoire pour toute manifestation avant publication.

## 4. SIX PRINCIPES DIRECTEURS

1. **Souveraineté nationale et pilotage MCTN** : le MCTN garde l'arbitrage final
2. **Transparence sélective** : chaque PTF voit ses propres positionnements, MCTN voit tout
3. **Validation institutionnelle obligatoire** : rien n'est public sans accord MCTN
4. **Co-construction** : les PTF peuvent proposer des cas, mais l'État qualifie
5. **Subsidiarité et alignement national** : les PTF s'alignent sur le portefeuille validé, pas l'inverse
6. **Confidentialité graduée** : besoin d'en connaître, classification à 3 niveaux

## 5. CALENDRIER

| Jalon | Date | Livrable |
|-------|------|----------|
| Validation note | 16 mai 2026 | Décisions M. DIABY / Moctar |
| Atelier stratégique | 19 mai 2026 | Vision présentée, 6 engagements recueillis |
| Engagements PTF | 2 juin 2026 | Points focaux, domaines, programmes transmis |
| Livraison module | 30 juin 2026 | Module fonctionnel en production |
| Formation PTF | 1ère semaine juillet | Session en ligne |
| Bilan trimestriel | Septembre 2026 | Atelier de suivi |

**Effort de développement** : 8 à 10 jours-homme pour le MVP, 15 à 20 jours-homme pour la version stabilisée. **Calendrier réaliste** : 4 à 6 semaines.

---

## 6. STRATÉGIE POUR L'ATELIER DU 19 MAI

**Posture proposée** : ne pas chercher à livrer le module en six jours. Présenter la vision et la roadmap, démontrer l'existant fonctionnel, recueillir des engagements concrets.

**Six engagements à recueillir de chaque PTF** :

1. Désignation d'un point focal PTF
2. Domaines d'intérêt formalisés (parmi les 14)
3. Liste des programmes numériques en cours
4. Liste des projets en préparation
5. Identification des cas PINS déjà pertinents
6. Accord de principe pour onboarding en juin

**Livrables obligatoires pour l'atelier** : présentation PowerPoint 15-20 slides + note synthétique 2 pages remise à chaque PTF.

## 7. SEPT DÉCISIONS SOUMISES À VALIDATION

| # | Décision | Statut |
|---|----------|--------|
| 1 | Périmètre fonctionnel | Validation demandée |
| 2 | Architecture technique | Validation demandée |
| 3 | Calendrier 4-6 semaines | Validation demandée |
| 4 | Stratégie atelier 19 mai (pas de livraison forcée) | Validation demandée |
| 5 | Niveau d'information visible aux PTF (3 niveaux) | Validation demandée |
| 6 | Cadre juridique d'accès (CGU + protocole) | Validation + délégation DAJ |
| 7 | Instance de revue (trimestrielle proposée) | Validation périodicité |

## 8. POINTS DE VIGILANCE PRINCIPAUX

**Risque politique** : éviter que les PTF perçoivent le module comme une plateforme de mise en concurrence ou une exposition publique de leurs stratégies. Mitigation : communication claire sur la finalité (coordination, anti-chevauchement), pas classement.

**Risque institutionnel** : coordination DAJ MCTN pour la formalisation des CGU et du protocole d'accès partenaire. Mitigation : engagement concertation dès validation note, cible cadre juridique validé fin juin.

**Risque opérationnel** : charge sur la DU pour la validation des manifestations (estimation : 1h/semaine). Mitigation : désignation d'un référent dédié, tableau de bord avec alertes d'ancienneté.

## 9. CHANTIERS CONNEXES À ENGAGER EN PARALLÈLE

Deux chantiers d'infrastructure soutiennent la mise en service du module mais ne le bloquent pas :

- **Système d'envoi d'emails opérationnel** (Brevo, SMTP SENUM ou Gmail Workspace MCTN) : prérequis du mode cible des notifications
- **UI de réinitialisation de mots de passe côté administrateur** : 1 jour-homme, gain significatif sur les opérations de support

## 10. DEMANDE

Validation collégiale d'une heure entre l'auteur, M. DIABY et M. Moctar, à votre convenance avant le 16 mai 2026 à 12h00. À défaut, validation par retour écrit sur la note complète. Le démarrage opérationnel du développement est cadré au lundi 19 mai 2026, en parallèle de l'atelier stratégique.

---

*Document complet en référence : note de cadrage v0.3 (30 pages, 14 950 mots, 10 sections, 5 annexes).*

*Synthèse produite par Birama DIOP, PFNI MCTN/SENUM SA, le 13 mai 2026.*
