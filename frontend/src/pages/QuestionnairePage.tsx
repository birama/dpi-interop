// Reexport vers le module refactore (V1 — Lot 1).
// Le monolithe original (1128 lignes) a ete decompose en :
//   modules/questionnaire/QuestionnairePage.tsx (orchestrateur, ~155 lignes)
//   modules/questionnaire/hooks/useQuestionnaireData.ts
//   modules/questionnaire/steps/Step1Infos.tsx ... Step8Attentes.tsx
//   modules/questionnaire/lib/questionnaireTypes.ts
// App.tsx continue d'importer { QuestionnairePage } depuis @/pages/QuestionnairePage.
export { QuestionnairePage } from '@/modules/questionnaire/QuestionnairePage';
