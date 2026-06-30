-- ============================================================
-- SCRIPT D'INSERTION DES COMPTES ATELIER DPI 4-6 MAI 2026
-- Généré pour la prod PINS (dpi-interop.senum.sn)
-- Password initial : Password123 (mustChangePassword=true)
-- Nombre de comptes : 59
-- ============================================================

-- ⚠️ AVANT D'EXÉCUTER : remplacer <HASH_BCRYPT> par le hash réel
-- Pour générer le hash, lancer :
-- docker exec pins-api node -e "const b=require('bcrypt');b.hash('Password123',10).then(h=>console.log(h));"

BEGIN;

-- Variables (PostgreSQL ne supporte pas les vraies variables, on inline le hash)
-- ⚠️ Remplacer ci-dessous PASSWORD_HASH_PLACEHOLDER par le hash bcrypt généré

--   1. Moctar SALL                              | Direction de la gestion et de la Planification des
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'sallmoctar@yahoo.fr', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MEPC' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sallmoctar@yahoo.fr');

--   2. Serigne mbacke madina Diop               | Fdmi
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'modouserignediop@gmail.com', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'AUTRE' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'modouserignediop@gmail.com');

--   3. Papa diatta seck                         | sencsu
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'papadiatta.seck@sencsu.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'AUTRE' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'papadiatta.seck@sencsu.sn');

--   4. PENDA TALL                               | Institut de technologie Alimentaire (ITA)
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'ptall@ita.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'ITA' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ptall@ita.sn');

--   5. Gorgoumack SENE                          | Ministere de l’energie, du petrole et des mines
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'gorgoumack.sene@mepm.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MEPM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'gorgoumack.sene@mepm.gouv.sn');

--   6. issa thiam                               | SENCSU
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'thiamissa@gmail.com', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'AUTRE' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'thiamissa@gmail.com');

--   7. DJIBY CAMARA                             | CAISSE DE SECURITE SOCIALE
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'djibycamara@secusociale.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'CSS' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'djibycamara@secusociale.sn');

--   8. diakaria DIALLO                          | presidence/ SGPR
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'diakaria.diallo@presidence.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'PR' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'diakaria.diallo@presidence.sn');

--   9. Abdourahmane SENE                        | Institut de Technologie Alimentaire (ITA)
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'asene@ita.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'ITA' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'asene@ita.sn');

--  10. WALY NDIAYE                              | Délégation générale à la Protection sociale et à l
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'waly.ndiaye@dgpsn.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'DGPSN' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'waly.ndiaye@dgpsn.gouv.sn');

--  11. MOUHAMADOU BOUSSO                        | DGID
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'mouhamadou.bousso@dgid.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'DGID' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mouhamadou.bousso@dgid.sn');

--  12. Ndeye Absa Deme GUEYE                    | DPTIC
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'ndeyeabsa.gueye@education.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MEN' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ndeyeabsa.gueye@education.sn');

--  13. Mamadou DIANGAR                          | DGID
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'mamadou.diangar@dgid.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'DGID' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mamadou.diangar@dgid.sn');

--  14. Boubacar Diop                            | Ministre de l intérieur et de la sécurité publique
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'boubacardiop@interieur.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'INTERIEUR' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'boubacardiop@interieur.gouv.sn');

--  15. abasse ndiaye                            | Direction Generale des Douanes
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'abandiaye@douanes.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'DGD' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'abandiaye@douanes.sn');

--  16. Abdoulaye Farba Sarr                     | Senum
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'papa.sarr@adie.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'papa.sarr@adie.sn');

--  17. Fatou Binetou DIAW                       | SENUM SA
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fatoubinetou.diaw@senegalnumeriquesa.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fatoubinetou.diaw@senegalnumeriquesa.sn');

--  18. Moussa FALL                              | SENEGAL NUMERIQUE SA
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'moussa.fall@senegalnumeriquesa.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'moussa.fall@senegalnumeriquesa.sn');

--  19. Fossar Mohamed DIOP                      | SENUM SA
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fossar.diop@senegalnumeriquesa.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fossar.diop@senegalnumeriquesa.sn');

--  20. OUMAR DIOP                               | Institut de Technologie Alimentaire (ITA)
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'oumardiop@ita.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'ITA' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'oumardiop@ita.sn');

--  21. Fatou GUEYE                              | SENUM SA
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fatou.gueye@senegalnumeriquesa.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fatou.gueye@senegalnumeriquesa.sn');

--  22. Fatoumata Thiaw                          | DDA/ MJ
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fatoumata.thiaw@justice.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MJ' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fatoumata.thiaw@justice.gouv.sn');

--  23. BIRANE NGOM                              | CSS
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'birane.ngom@secusociale.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'CSS' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'birane.ngom@secusociale.sn');

--  24. Abdoulaye NDOUR                          | AGEROUTE
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'andour@ageroute.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'AGEROUTE' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'andour@ageroute.sn');

--  25. Ibrahima NDIAYE                          | Ministère de la Santé et de l’Hygiène Publique
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'ibrahima.ndiaye@sante.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MSHP' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ibrahima.ndiaye@sante.gouv.sn');

--  26. Aïssatou Sowe                            | Ministère de l’Education nationale
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'aissatou.sowe@education.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MEN' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'aissatou.sowe@education.sn');

--  27. Alioune WADE                             | Ministère de l’urbanisme des collectivités territo
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'alioune.wade@urbanisme.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'URBA' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alioune.wade@urbanisme.gouv.sn');

--  28. Khadidiatou Sarr                         | Senegal Numérique
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'sarrkhadii46@gmail.com', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'AUTRE' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sarrkhadii46@gmail.com');

--  29. Fatou Boye NDIOUCK                       | CDP
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fatou.boye@cdp.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'CDP' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fatou.boye@cdp.sn');

--  30. Cheikh Abdou Lahad Diagne                | Ministère de la Santé et de l'Hygiène publique
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'diagne.cal@gmail.com', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MSHP' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'diagne.cal@gmail.com');

--  31. Cheikh Anta Diop DIONGUE                 | Ministère de la Microfinance et de l'Economie soci
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cheikhanta.diongue@microfinance-ess.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'FIMF' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'cheikhanta.diongue@microfinance-ess.gouv.sn');

--  32. Papa Sémou DIOUF                         | Di/Tresor
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'papasemou.diouf@tresor.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'DGCPT' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'papasemou.diouf@tresor.gouv.sn');

--  33. Maimouna KAMARA                          | SENUM
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'maimouna.kamara@senegalnumeriquesa.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'maimouna.kamara@senegalnumeriquesa.sn');

--  34. Amadou BA                                | Douanes
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'amba@douanes.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'DGD' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'amba@douanes.sn');

--  35. Papa Cheikh DIOP                         | Sénégal Numérique SA
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'papacheikh.diop@senegalnumeriquesa.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'papacheikh.diop@senegalnumeriquesa.sn');

--  36. Oumoul Khairy KANE                       | Caisse de Sécurité Sociale
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'khairy@secusociale.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'CSS' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'khairy@secusociale.sn');

--  37. Khadim Gaye                              | Sénégal Numérique SA
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'khadim.gaye@adie.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'khadim.gaye@adie.sn');

--  38. Cheikh Abdoukhadre Coulibaly             | FIMF/Ministre de la Micro-finance et de l'économie
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'abdoukhadre.coulibaly@fimf.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'FIMF' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'abdoukhadre.coulibaly@fimf.sn');

--  40. Khadidiatou WADE                         | SENUM
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'khadidiatou.wade@senegalnumeriquesa.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'khadidiatou.wade@senegalnumeriquesa.sn');

--  41. Ndèye Penda Faye                         | DTAI
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'npfaye@minfinances.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MFB' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'npfaye@minfinances.sn');

--  43. Papa Diadia BA                           | DI-DGCPT
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'papadiadia.ba@tresor.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'DGCPT' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'papadiadia.ba@tresor.gouv.sn');

--  44. Mame Tiné SALL                           | Ministère de la Culture de l'Artisanat et du Touri
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'mametine.sall@mcat.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MCAT' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mametine.sall@mcat.gouv.sn');

--  45. Alioune Badara Fall                      | Ministere de l'éducation nationale
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'aliounebadara.fall14@education.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MEN' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'aliounebadara.fall14@education.sn');

--  46. Mouhamed LO                              | SENUM
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'mouhamed.lo@senegalnumeriquesa.com', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mouhamed.lo@senegalnumeriquesa.com');

--  47. Ibrahima Khaliloulah Dia                 | MSHP
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'ibrahimakhaliloulah.dia@sante.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MSHP' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ibrahimakhaliloulah.dia@sante.gouv.sn');

--  49. Mame Isseu Diop                          | Ministère de l'Hydraulique et de l'Assainissement 
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'informatique@mha.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'HYDRO' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'informatique@mha.gouv.sn');

--  53. Papa Samba MBENGUE                       | ACCENTURE Japan
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'mbenguepapesamba@yahoo.fr', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'ACCENTURE' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mbenguepapesamba@yahoo.fr');

--  55. Sokhna Bineta Sylla                      | SE/CNLS
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'sokhnabineta.diop@cnls.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'CNLS' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sokhnabineta.diop@cnls.gouv.sn');

--  56. Diéne DIOUF                              | DGPSN
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'dienedf123@gmail.com', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'DGPSN' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dienedf123@gmail.com');

--  57. Adama Gueye                              | Direction de l’horticulture du MASAE
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'gueyadam@gmail.com', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MCAT' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'gueyadam@gmail.com');

--  58. Mamadou Gaye SAMB                        | Ministère de l’Enseignement supérieur, de la Reche
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'mamadou.samb@mesri.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MESR' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mamadou.samb@mesri.gouv.sn');

--  59. Sokhna Faty Mbacké                       | Ministère de la fonction publique, du travail et d
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'sokhnaf.mbacke@fpublique.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MFP' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sokhnaf.mbacke@fpublique.gouv.sn');

--  60. Baba Dabo                                | Senum
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'baba.dabo@senegalnumeriquesa.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'SENUM' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'baba.dabo@senegalnumeriquesa.sn');

--  61. Macky Tall Diallo                        | Agence de Développement Local
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'mackytall@adl.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'ADL' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mackytall@adl.sn');

--  62. Mamadou Dahir SAMBOU                     | Hôpital Principal de Dakar
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'dahirma1@gmail.com', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'ITA' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dahirma1@gmail.com');

--  64. Souleymane Gueye                         | PAENS
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'souleymane.gueye@paens.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'PAENS' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'souleymane.gueye@paens.gouv.sn');

--  65. Paul Diouf                               | MEPC
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'pauldominiquejacques.diouf@economie.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MEPC' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'pauldominiquejacques.diouf@economie.gouv.sn');

--  66. Bocar Kane                               | PAENS
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'bocar.kane@paens.gouv.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'PAENS' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bocar.kane@paens.gouv.sn');

--  67. Seyni Malan FATI                         | Ministère des Finances et du Budget
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'smfati@minfinances.sn', 'PASSWORD_HASH_PLACEHOLDER', 'INSTITUTION',
  (SELECT id FROM institutions WHERE code = 'MFB' LIMIT 1),
  true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'smfati@minfinances.sn');

-- Vérification finale
SELECT COUNT(*) AS users_total, COUNT(*) FILTER (WHERE "mustChangePassword" = true) AS must_change FROM users;

COMMIT;