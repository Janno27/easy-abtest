# API Backend Module

Ce module contient les endpoints API utilisés par l'application pour communiquer avec différentes plateformes d'A/B testing.

## Structure

- `abtasty.py`: Module d'intégration avec l'API AB Tasty

## AB Tasty Integration (`abtasty.py`)

### Vue d'ensemble

Ce module fournit une interface entre l'application frontend et l'API AB Tasty. Il gère :
- L'authentification OAuth2
- La récupération des tests AB Tasty
- La validation des credentials

### Endpoints

#### 1. Vérification des credentials (`/api/verify`)

**Méthode**: `POST`

**Description**: Vérifie la validité des credentials AB Tasty en tentant d'obtenir un token d'authentification.

**Requête**:
```json
{
  "client_id": "votre_client_id",
  "client_secret": "votre_client_secret"
}
```

**Réponse**:
```json
{
  "valid": true|false
}
```

#### 2. Récupération des tests (`/api/tests`)

**Méthode**: `GET`

**Description**: Récupère la liste des tests AB Tasty pour un compte spécifique.

**Paramètres de requête**:
- `client_id`: Client ID pour l'authentification
- `client_secret`: Client Secret pour l'authentification
- `account_id`: ID numérique du compte (5-6 chiffres)
- `types`: Types de tests à récupérer (ab, mastersegment, etc.)
- `status`: Statut des tests (1 pour actifs, 0 pour inactifs)
- `page`: Numéro de page pour la pagination
- `per_page`: Nombre d'éléments par page

**Réponse**:
```json
{
  "_embedded": {
    "items": [
      {
        "id": 123456,
        "name": "Nom du test",
        "state": "running",
        "creation_date": "2023-01-01T00:00:00Z",
        ...
      }
    ]
  },
  "_links": { ... },
  "page": 1,
  "per_page": 50,
  "total": 100
}
```

### Authentification

Le module utilise l'authentification OAuth2 avec le flux `client_credentials`. Le processus est le suivant :

1. Envoi des credentials (client_id et client_secret) à l'endpoint `/oauth/v2/token` d'AB Tasty
2. Réception d'un token d'accès
3. Utilisation de ce token pour les requêtes API ultérieures

### Intégration avec le Frontend

Le frontend interagit avec ce module via les composants suivants :

1. **ABTastyToolConfig.tsx**:
   - Gère la configuration des propriétés AB Tasty
   - Stocke les credentials dans le localStorage
   - Vérifie la validité des credentials via l'endpoint `/api/verify`

2. **ABTastyList.tsx**:
   - Récupère les tests via l'endpoint `/api/tests`
   - Permet de filtrer les tests par type et statut
   - Affiche les résultats dans un tableau

### Gestion des erreurs

Le module inclut une gestion complète des erreurs :
- Logging détaillé des requêtes et réponses
- Transmission des codes d'erreur HTTP appropriés
- Messages d'erreur descriptifs pour faciliter le débogage

### Notes techniques

- L'API utilise la bibliothèque `httpx` pour les requêtes HTTP asynchrones
- Les paramètres multi-valués (comme `filter[type][]`) sont gérés correctement pour l'API AB Tasty
- La pagination est supportée pour récupérer de grandes quantités de tests 