# A/B Test Calculator

Un calculateur avancé de tests A/B qui utilise des méthodes statistiques robustes pour déterminer la taille d'échantillon nécessaire et la durée estimée d'un test.

## Architecture

L'application est constituée de deux parties principales :

1. **Frontend React** : Interface utilisateur interactive qui permet de configurer les paramètres du test
2. **Backend FastAPI** : API qui effectue les calculs statistiques complexes

### Frontend (React + TypeScript)

Le frontend est développé avec React et TypeScript, utilisant une architecture de composants modulaire pour une maintenance facile et une évolutivité.

#### Composants Principaux

##### `DurationCalculator.tsx`
Le composant principal qui orchestre l'ensemble de l'interface utilisateur du calculateur.

**Fonctionnalités** :
- Formulaire de saisie des paramètres de test (visites quotidiennes, conversions, etc.)
- Sélection de la méthode statistique (fréquentiste ou bayésienne)
- Paramètres statistiques avancés (puissance statistique, priors bayésiens)
- Validation des entrées utilisateur
- Communication avec l'API backend via fetch
- Affichage des résultats via le composant TestResultsDisplay

**Points techniques** :
- Utilisation d'hooks React (useState, useEffect, useRef, useMemo)
- Gestion d'état local pour tous les paramètres de formulaire
- Gestion des tooltips informatifs avec positionnement dynamique
- Composants d'UI personnalisés (sliders, dropdowns, boutons)
- Effet de bordure en dégradé avec animation suivant la souris

##### `TestResultsDisplay.tsx`
Affiche les résultats du calcul de manière claire et concise.

**Fonctionnalités** :
- Affichage de la durée estimée du test et de la taille d'échantillon
- Tableau d'évolution hebdomadaire montrant comment le MDE change au fil du temps
- Visualisation du taux de conversion cible
- Indication du statut optimal pour la durée du test
- Accès aux calculs détaillés via un bouton

**Points techniques** :
- Utilisation d'un effet visuel pour distinguer les différents statuts (trop court, optimal, trop long)
- Appel API séparé pour récupérer les données d'évolution
- Formatage des nombres pour une meilleure lisibilité

##### `DetailedCalculationView.tsx`
Affiche une explication détaillée, étape par étape, des calculs statistiques effectués.

**Fonctionnalités** :
- Explication des calculs pour les méthodes fréquentiste et bayésienne
- Affichage des formules mathématiques utilisées
- Présentation des paramètres d'entrée et des résultats intermédiaires

**Points techniques** :
- Utilisation d'un composant Dialog modal
- Calculs détaillés étape par étape
- Formatage des nombres et des formules mathématiques

### Backend (FastAPI + Python)

Le backend est construit avec FastAPI, offrant une API RESTful performante qui gère les calculs statistiques complexes.

#### Structure des Dossiers

```
app/
├── main.py               # Point d'entrée de l'application
├── routers/
│   └── estimate.py       # Endpoints de l'API
├── services/
│   └── statistics.py     # Logique de calcul statistique
├── models/
│   └── schemas.py        # Modèles de données et validation
└── core/
    └── config.py         # Configuration de l'application
```

#### Points Principaux

##### Endpoints API (`routers/estimate.py`)

L'API expose deux endpoints principaux :

1. **`/estimate`** : Calcule la taille d'échantillon et la durée estimée du test
   - Entrées : paramètres de test (visites quotidiennes, taux de conversion, etc.)
   - Sorties : taille d'échantillon par variation, taille totale, jours estimés

2. **`/estimate/weekly-evolution`** : Calcule l'évolution du MDE au fil des semaines
   - Entrées : mêmes paramètres que /estimate
   - Sorties : tableau de données hebdomadaires avec :
     - Nombre de visiteurs cumulés par variation
     - MDE relatif détectable à chaque semaine
     - Statut de la durée (trop courte, optimale, trop longue)
     - Taux de conversion cible

##### Calculs Statistiques (`services/statistics.py`)

Le service implémente deux calculateurs statistiques :

1. **FrequentistCalculator** :
   - Utilise la méthode de variance exacte pour les deux groupes
   - Prend en compte les Z-scores pour le niveau de confiance et la puissance
   - Calcule la taille d'échantillon nécessaire en fonction du MDE

2. **BayesianCalculator** :
   - Utilise des simulations Monte Carlo (50 000 itérations)
   - Implémente un algorithme de recherche binaire pour trouver la taille d'échantillon minimale
   - Prend en compte les priors Beta définis par l'utilisateur

##### Validation des Données (`models/schemas.py`)

Validation rigoureuse des entrées avec Pydantic :
- Vérification que les paramètres sont cohérents avec la méthode statistique
- Validation que l'amélioration attendue est dans une plage réaliste
- Contrôle que le MDE est réalisable par rapport au taux de base

## Fonctionnalités Statistiques Avancées

### Méthode Fréquentiste

- **Formule de variance exacte** : Utilise la formule de variance pour les deux groupes indépendants au lieu de l'approximation pooled
- **Types de test** : Prend en charge les tests unilatéraux (one-sided) et bilatéraux (two-sided)
- **Puissance statistique** : Personnalisable de 70% à 95%

### Méthode Bayésienne

- **Simulations Monte Carlo** : Utilise 50 000 itérations pour des résultats précis
- **Priors personnalisables** : Support pour différents priors Beta, y compris le prior non informatif de Jeffreys (0.5, 0.5)
- **Probabilité directe** : Calcule directement P(B>A) au lieu de p-values

### Tableau d'Évolution Hebdomadaire

- Montre comment le MDE détectable change à mesure que plus de données sont collectées
- Indique le taux de conversion cible (baseline + amélioration relative)
- Code couleur pour identifier rapidement la durée optimale du test

## Déploiement et Utilisation

### Prérequis

- Python 3.8+
- Node.js 14+
- npm ou yarn

### Installation Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Installation Frontend

```bash
cd frontend
npm install
npm run dev
```

### Variables d'Environnement

- `VITE_API_URL` : URL de l'API backend (par défaut: http://localhost:8000)

## Notes Techniques

- **Cohérence des calculs** : Les calculs du frontend et du backend sont synchronisés pour afficher des résultats cohérents
- **Optimisations statistiques** : Utilisation des formules exactes au lieu d'approximations
- **Validations robustes** : Prévention des valeurs impossibles ou non réalistes
- **Responsive design** : Fonctionne sur les appareils mobiles et de bureau
- **Extensibilité** : Architecture modulaire facilitant l'ajout de nouvelles méthodes statistiques 