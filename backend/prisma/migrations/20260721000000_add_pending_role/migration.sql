-- Phase 2 — Sécurité : rôle PENDING ajouté à l'enum Role.
-- Transaction 1/2 : ajout de la valeur uniquement.
-- Le SET DEFAULT est dans la migration suivante (PostgreSQL interdit de référencer
-- une valeur d'enum fraîchement ajoutée dans la même transaction).

ALTER TYPE "Role" ADD VALUE 'PENDING';
