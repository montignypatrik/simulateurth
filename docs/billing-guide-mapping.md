# Pratiques, programmes, activités et secteurs

Les pages ci-dessous sont les **pages du fichier PDF**, et non les numéros imprimés dans le pied de page. Les fichiers fournis sont les références de cette implémentation. Ce document décrit un catalogue de simulation TH, pas une vérification d’admissibilité, de nomination, de plafond ou de tarif.

Guides : [Cabinet](<../FACNET - Guide de facturation - Cabinet.pdf>), [CLSC](<../Guide de facturation_CLSC_TH.pdf>), [GMF-U](<../Guide de facturation _ GMF-U_TH.pdf>), [Courte durée](<../Guide de facturation _ Courte durée_à tarif horaire.pdf>), [Réadaptation](<../Guide de facturation_Réadaptation_TH.docx.pdf>).

## Correspondances avec le catalogue initial

| Pratique initiale | Programme / activités | Correspondance dans les guides | Traitement |
| --- | --- | --- | --- |
| CHSLD | `101015`, `101030`, `101032`, `101043`, `101055`, `101063`, `101097`, `101098`, `101132`, `101414`–`101418` | Aucun guide CHSLD fourni. Le guide Courte durée, p. 6, emploie aussi le préfixe `101` pour la gériatrie, mais avec le secteur de jour **2**, alors que le CHSLD existant utilise **4**. | Conserver le catalogue CHSLD et ses règles existantes ; ne pas assimiler ses activités à la gériatrie hospitalière. |
| CLSC | Toxicomanie, préfixe `263` | CLSC, p. 4 ; secteurs p. 6 | Conserver ce programme par défaut et ajouter les autres programmes. |
| Cabinet | `072101` Activités de fonctionnement en GMF | Cabinet, p. 31–32 (`72101` dans le guide) | Conserver le code existant avec zéro initial ; accepter aussi `72101` dans le calcul. Secteur 0 préexistant. |
| Soins palliatifs | `53030`, `53032`, `53037`, `53043`, `53055`, `53063`, `53071` | Courte durée, p. 8–9 | Conserver le raccourci existant et ajouter le programme au sein de Courte durée. Le guide décrit une unité hospitalière ; le raccourci maison de soins palliatifs reste un héritage de l’application. |

## Ajouts

| Pratique | Programmes / codes d’activité TH | Source |
| --- | --- | --- |
| CLSC | Général `002`, Toxicomanie `263`, Itinérance `264`, Santé mentale `276` : suffixes `015`, `030`, `031`, `032`, `037`, `043`, `055`, `063`, `071`, `098`, `414`–`418` | CLSC, p. 4 ; détails Santé mentale p. 12 |
| CLSC | Soutien à domicile : **uniquement `002404`** | CLSC, p. 4 |
| CLSC | Centre de détention : `88030` | CLSC, p. 4 |
| CLSC | Centre antipoison : `89030`, `89067` | CLSC, p. 5 |
| CLSC | GMF (EP 33) : `072101`, `72103` ; GMF-R (EP 54) : `269110` SRV, `269111` bureau | CLSC, p. 26–29 |
| GMF-U | Médecin enseignant (EP 42) : `51015`, `51027`, `51028`, `51030`, `51031`, `51032`, `51043`, `51416`, `51068`, `51069`, `63030` | GMF-U, p. 4 |
| GMF-U | GMF (EP 33) : `072101`, `72103` ; Clinique-réseau (EP 39) : `76110`, `76111` ; GMF-R (EP 54) : `269110`, `269111` | GMF-U, p. 23–26 |
| Courte durée | URFI `102`, Toxicomanie `31`, Gériatrie `101` : suffixes `030`, `032`, `043`, `055`, `063`, `071` | Courte durée, p. 4–6 |
| Courte durée | Psychiatrie `27` : suffixes `030`, `032`, `037`, `043`, `055`, `063`, `071`, `414`–`418` (CMDP) | Courte durée, p. 6–8 |
| Courte durée | Soins palliatifs `53` : catalogue existant ci-dessus | Courte durée, p. 8–9 |
| Courte durée | Clinique de la douleur, aide aux victimes d’agression à caractère sexuel, oncologie, maladie du sein, traitement des dépendances : `54030`, `54032`, `54043`, `54055` | Courte durée, p. 9 (EP 49) |
| Réadaptation | Adaptation-réadaptation : `102030`, `102032`, `102043`, `102055`, `102063`, `102071` | Réadaptation, p. 4 |
| Réadaptation | Déficience physique : `100015`, `100030`, `100032`, `100043`, `100055`, `100098` | Réadaptation, p. 4–5 |

Les codes à l’acte, forfaits, suppléments et codes explicitement **HF seulement** ne sont pas ajoutés au catalogue TH. Exemple : `31132`, présent dans le guide Courte durée p. 5, est HF seulement. Le `101132` CHSLD préexistant est conservé faute de guide CHSLD. Les codes sont des chaînes pour conserver les zéros initiaux.

## Secteurs documentés

La règle explicite du dernier commit applicatif (`d098238`, « secteur 0 for 043 admin tasks only during weekday day hours ») est conservée et étendue aux nouvelles activités **043**. Le secteur **0** s’applique pendant la période régulière de semaine : 08:00–18:00 en CLSC/GMF-U, 08:00–20:00 en milieu hospitalier/réadaptation. Les soirs, fins de semaine et fériés suivent le tableau du programme. Les annotations « secteur 0 » des guides sont donc utilisées comme secteur régulier, conformément à cette correction existante. Cette règle couvre aussi `31043` par continuité avec le comportement des tâches administratives de l’application.

Les activités de fonctionnement en GMF (`072101` / `72101`) restent à **0 en tout temps**, comme dans le catalogue initial.

### CLSC / GMF-U

Sources : CLSC p. 6, GMF-U p. 4.

| Période | Secteur |
| --- | --- |
| Lundi–vendredi, non férié, 08:00–18:00 | 1 |
| Lundi–jeudi, non férié, 18:00–20:00 | 23 |
| Lundi–jeudi, non férié, 20:00–22:00 | 24 |
| Vendredi, non férié, 18:00–20:00 | 25 |
| Vendredi, non férié, 20:00–22:00 | 26 |
| Samedi / dimanche / férié, 08:00–24:00 | 27 ; 28 pour les activités SRV en clinique-réseau |
| GMF-U, tous les jours, 00:00–08:00 | 0 |

Le secteur **28** est affecté aux activités SRV `76110` et `269110`, pas aux activités bureau `76111` et `269111`. Cette distinction est également indiquée dans la [description RAMQ des secteurs, Brochure no 2, section 2.2](https://www.ramq.gouv.qc.ca/SiteCollectionDocuments/professionnels/manuels/105-brochure-2-omnipraticiens/maj49_hon_f_tarif_h_omni.pdf).

### Courte durée / Réadaptation

Sources : Courte durée p. 4–9, Réadaptation p. 6.

| Programme | Secteur en semaine non fériée, 08:00–20:00 |
| --- | --- |
| URFI et Gériatrie, en Courte durée | 2 |
| Toxicomanie et programmes EP 49, en Courte durée | 3 |
| Psychiatrie, en Courte durée | 8 |
| Soins palliatifs | 0 |
| Adaptation-réadaptation et Déficience physique, en Réadaptation | 3 |

Tous ces tableaux spécifient **29** du lundi au jeudi de 20:00 à 24:00, **30** le vendredi de 20:00 à 24:00, **31** le samedi/dimanche/férié de 08:00 à 24:00 et **42** le samedi/dimanche/férié de 00:00 à 08:00. Les activités de fonctionnement en GMF restent à secteur fixe 0 ; les tâches 043 suivent les majorations décrites ci-dessus.

## Périodes hors tableau et précisions du propriétaire

| Guide | Pages PDF | Période absente du tableau |
| --- | --- | --- |
| CLSC | 6 | 00:00–08:00 tous les jours ; 22:00–24:00 en semaine non fériée |
| GMF-U | 4 | 22:00–24:00 en semaine non fériée |
| Courte durée | 4–9 | 00:00–08:00 en semaine non fériée |
| Réadaptation | 6 | 00:00–08:00 en semaine non fériée |

Le propriétaire a confirmé que toutes les périodes absentes des tableaux ci-dessus ne seront pas utilisées : fermeture / absence d’activité en CLSC et GMF-U, et aucune saisie de nuit en semaine pour Courte durée ou Réadaptation. Il ne reste donc aucune période horaire en attente de clarification dans ce périmètre.

Si elles sont néanmoins saisies, ces périodes produisent un secteur vide et un avis « Secteurs à valider » précisant date, heures, programme et activité. Les heures sont conservées dans le total. Aucun secteur hospitalier 42 n’est attribué automatiquement aux nuits CLSC. Les secteurs 24/26 ne sont pas prolongés après 22:00. Un couple pratique/programme/activité inconnu ne reçoit pas de secteur CHSLD par défaut.

Les guides portent des dates de versions différentes, parfois contradictoires entre couverture et pied de page. Cette implémentation reproduit les tableaux fournis ; elle ne prétend pas couvrir toutes les ententes en vigueur. Le calendrier de jours fériés de l’application reste celui déjà fourni, du 18 mai 2026 au 29 mars 2027.

## Fonctionnement et vérification

- Catalogue partagé : `src/data/billingCatalog.ts`.
- Règles et découpage : `src/utils/billingRules.ts`.
- Demandes hebdomadaires : `src/utils/buildDemandes.ts`.
- Une plage est découpée aux limites 08:00, 12:00, 18:00, 20:00, 22:00 et minuit ; les segments de même date/plage/code/secteur sont regroupés.
- Une période traversant minuit est affectée aux deux dates réelles. Le passage samedi/dimanche génère deux semaines de demande. Les minutes sont additionnées avant l’arrondi en heures.
- Les trois modèles de demande consomment le même résultat. La sélection d’un programme est sauvegardée et restaurée lors de la modification des heures.
- Vérifications : `npm test`, `npm run lint`, `npm run build`.
- Vérification manuelle automatisée dans Chromium : 25 programmes sélectionnables, sauvegarde et modification pour CLSC/GMF-U/Courte durée/Réadaptation, changement entre les trois modèles et sauvegarde à une largeur mobile de 390 pixels ; aucune erreur JavaScript observée.
