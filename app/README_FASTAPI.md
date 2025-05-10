# A/B Test Calculator API

A FastAPI service that calculates sample sizes and estimated durations for A/B tests, designed to work with the front-end A/B Test Calculator.

## Features

- Calculate required sample sizes for both Frequentist and Bayesian A/B tests
- Support for one-sided and two-sided tests
- Customizable statistical parameters (confidence, power, prior distributions)
- AI-powered hypothesis formulation assistant with multiple LLM models support
- Real-time LLM reasoning visualization with Server-Sent Events (SSE)
- Multi-language support (FR/EN/ES/DE) with automatic language detection
- Integration with external A/B testing platforms (AB Tasty) via API
- Support for CSV data import for manual test analysis
- Async API for high performance
- Production-ready structure with logging, dependency injection, and comprehensive tests

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ab-test-calculator-api.git
cd ab-test-calculator-api
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure your environment variables in a `.env` file:
```
# API Keys for LLMs
HF_API_KEY=your_huggingface_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# Model configurations
HF_LLAMA_MODEL=meta-llama/Llama-3.3-70B-Instruct
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_REASONER_MODEL=deepseek-ai/deepseek-reasoner-v1.5

# Config directory for storing user API keys
CONFIG_DIR=./config
```

## Usage

### Running the API

Start the API server:

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### API Endpoints

#### POST /estimate

Calculate the required sample size and test duration for an A/B test.

**Example Request:**

```python
import requests

url = "http://localhost:8000/estimate"
payload = {
    "daily_visits": 1000,
    "daily_conversions": 100,
    "traffic_allocation": 0.5,
    "expected_improvement": 0.02,
    "variations": 2,
    "confidence": 0.95,
    "statistical_method": "frequentist",
    "test_type": "two-sided",
    "power": 0.8
}
response = requests.post(url, json=payload)
print(response.json())
```

**Example Response:**

```json
{
  "sample_size_per_variation": 3840,
  "total_sample": 7680,
  "estimated_days": 15
}
```

#### POST /hypothesis/generate

Generate AI-assisted hypothesis formulation for A/B tests using different LLM models.

**Example Request:**

```python
import requests

url = "http://localhost:8000/hypothesis/generate"
payload = {
    "message": "J'ai l'impression que mon taux de conversion depuis la page produit a chuté, peut-être que la position du CTA est mal positionnée.",
    "conversation_id": None,  # Optional: provide to continue a conversation
    "message_history": [],    # Optional: previous messages in the conversation
    "model": "deepseek"       # Options: "llama", "deepseek", "deepseek-reasoner"
}
response = requests.post(url, json=payload)
print(response.json())
```

**Example Response:**

```json
{
  "message": "Quelle page ou fonctionnalité spécifique semble poser problème? Pourriez-vous me donner plus de détails sur cette page produit?",
  "conversation_id": "conv_1715007845123",
  "timestamp": 1715007845.123456
}
```

#### GET /hypothesis/stream

Stream LLM reasoning steps in real-time using Server-Sent Events (SSE).

**Example Request:**

```javascript
// Frontend JavaScript using EventSource
const params = new URLSearchParams();
params.append('message', 'Comment optimiser la page d\'accueil de mon site e-commerce?');
params.append('model', 'deepseek-reasoner');

const url = `http://localhost:8000/hypothesis/stream?${params.toString()}`;
const eventSource = new EventSource(url);

eventSource.onmessage = (event) => {
  try {
    // Vérifier si c'est un message [DONE] de fin de stream
    if (event.data === "[DONE]") {
      console.log("Stream completed");
      eventSource.close();
      return;
    }
    
    // Traiter les données JSON
    const data = JSON.parse(event.data);
    console.log("Thinking step:", data);
    // Afficher les données dans l'interface utilisateur
    updateUI(data);
  } catch (error) {
    console.error("Error processing stream data:", error);
  }
};

eventSource.onerror = (error) => {
  console.error("SSE Error:", error);
  eventSource.close();
};
```

#### GET /api/external/abtasty/tests

Récupère la liste des tests AB Tasty depuis l'API officielle.

**Exemple de requête:**

```python
import requests

url = "http://localhost:8000/api/external/abtasty/tests"
headers = {"Authorization": "Bearer your_auth_token"}  # Si authentification configurée
response = requests.get(url, headers=headers)
print(response.json())
```

**Exemple de réponse:**

```json
[
  {
    "id": "12345",
    "name": "Test CTA Homepage",
    "status": "running",
    "traffic_allocation": 0.5,
    "variations": [
      {
        "id": "var1",
        "name": "Control",
        "visitors": 1500,
        "conversions": 150
      },
      {
        "id": "var2",
        "name": "Variation 1",
        "visitors": 1450,
        "conversions": 160
      }
    ]
  }
]
```

#### POST /api/imports/upload/csv

Importe et traite des données de test A/B à partir d'un fichier CSV.

**Exemple de requête:**

```python
import requests

url = "http://localhost:8000/api/imports/upload/csv"
files = {"file": open("test_data.csv", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

**Format CSV attendu:**

```csv
test_name,variation,visitors,conversions
Test Homepage,Control,1200,120
Test Homepage,Variation 1,1180,130
```

**Exemple de réponse:**

```json
{
  "success": true,
  "filename": "test_data.csv",
  "row_count": 2,
  "data": [
    {
      "test_name": "Test Homepage",
      "variation": "Control",
      "visitors": "1200",
      "conversions": "120"
    },
    {
      "test_name": "Test Homepage",
      "variation": "Variation 1",
      "visitors": "1180",
      "conversions": "130"
    }
  ]
}
```

**Stream Response Format:**

Le stream renvoie une série de messages SSE contenant des objets JSON formatés comme suit:

```json
{
  "step": "reasoning",
  "status": "processing",
  "reasoning_content": "Pour optimiser la page d'accueil d'un site e-commerce, je dois considérer plusieurs aspects:\n1. La clarté de la proposition de valeur\n2. L'efficacité du parcours utilisateur..."
}
```

Suivi d'un message final:

```
data: [DONE]
```

**Caractéristiques du stream:**
- Détection automatique de la langue (FR/EN/ES/DE)
- Messages adaptés à la langue détectée
- Gestion des erreurs avec messages appropriés
- Signal de fin de stream avec [DONE]

**Supported LLM Models:**
- `llama`: Meta's Llama 3 model via Hugging Face API
- `deepseek`: Standard Deepseek Chat model via Deepseek API
- `deepseek-reasoner`: Deepseek Reasoner model (better for complex reasoning) via Deepseek API

**Hypothesis Generation Process:**
1. The API uses a structured prompt to guide the conversation
2. It asks clarifying questions to gather all necessary information
3. Once sufficient context is collected, it formulates a structured hypothesis
4. The hypothesis follows the format: "If [change], then [metric] will [impact] because [mechanism], measured via [method]"

### Integration with Front-End

The API is designed to work seamlessly with the front-end A/B Test Calculator. Here's an example of how to call the API from the front-end:

```typescript
// Example of how to call the API from React
const calculateDuration = async () => {
  try {
    const requestData = {
      daily_visits: parseInt(dailyVisits),
      daily_conversions: parseInt(dailyConversions),
      traffic_allocation: trafficAllocation[0] / 100,
      expected_improvement: parseFloat(expectedImprovement) / 100,
      variations: parseInt(variations),
      confidence: parseFloat(confidence) / 100,
      statistical_method: statisticalMethod === 'frequentist' ? 'frequentist' : 'bayesian',
      test_type: testType === '1-sided' ? 'one-sided' : 'two-sided',
      power: statisticalMethod === 'frequentist' ? parseFloat(statisticalPower) / 100 : undefined,
      prior_alpha: statisticalMethod === 'bayesian' ? parseFloat(priorAlpha) : undefined,
      prior_beta: statisticalMethod === 'bayesian' ? parseFloat(priorBeta) : undefined
    };

    const response = await fetch('http://localhost:8000/estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    setCalculationResults(result);
  } catch (error) {
    console.error('Error calculating duration:', error);
  }
};
```

### Configuration des API externes

Pour configurer vos clés API pour les services externes, vous pouvez utiliser la section Settings de l'application frontend ou créer manuellement un fichier de configuration:

1. Créez un fichier `config/user_api_keys.json` avec le contenu suivant:

```json
{
  "abtasty": "votre_clé_api_abtasty"
}
```

2. Assurez-vous que le dossier `config` est accessible en lecture/écriture par l'application.

### Real-time LLM Reasoning Component

Le backend inclut un endpoint de streaming SSE `/hypothesis/stream` qui permet de visualiser en temps réel le processus de réflexion du modèle LLM lors de la génération d'hypothèses. Ce composant:

1. Utilise Server-Sent Events (SSE) pour une communication en temps réel
2. Gère les timeouts et reconnexions automatiques
3. Supporte la mise en forme du contenu de raisonnement pour une présentation claire
4. S'adapte automatiquement à la langue de l'utilisateur (français, anglais, espagnol, allemand)
5. Inclut le traitement d'erreurs robuste côté serveur et client

**Détails techniques backend:**
- Asynchrone avec FastAPI et httpx pour les requêtes API
- Optimisation des performances avec streaming de faible latence
- Gestion sécurisée des clés API via injection de dépendances
- Headers CORS configurés pour permettre l'accès depuis différentes origines
- Signaux [DONE] pour indiquer la fin du stream et éviter les connexions pendantes

## Architecture du code

Le projet suit une architecture modulaire pour faciliter la maintenance et l'évolution du code:

### Structure des dossiers

```
app/
├── core/                 # Fonctionnalités centrales (config, logging, auth, etc.)
│   ├── __init__.py       # Exports du module
│   ├── config.py         # Configuration de l'application
│   ├── logging.py        # Configuration des logs
│   └── auth.py           # Gestion d'authentification et des clés API
├── routers/              # Définition des routes API
│   ├── estimate.py       # Endpoints pour le calcul d'estimations A/B test 
│   ├── hypothesis/       # Module pour la génération d'hypothèses (modulaire)
│   │   ├── __init__.py   # Exports du module
│   │   ├── router.py     # Définitions des routes et des endpoints
│   │   ├── models.py     # Modèles de données Pydantic
│   │   ├── streaming.py  # Fonctions liées au streaming SSE
│   │   ├── api_calls.py  # Appels aux API externes (Hugging Face, Deepseek)
│   │   └── data_extraction.py  # Extraction de données structurées
│   ├── hypothesis.py     # Import du router depuis le module hypothesis
│   ├── external_apis.py  # Endpoints pour l'intégration avec des outils externes (AB Tasty, etc.)
│   └── imports.py        # Endpoints pour l'importation de données (CSV, etc.)
├── services/             # Services réutilisables
│   ├── base_external_service.py  # Interface abstraite pour les services d'API externes
│   └── abtasty_service.py        # Service client pour l'API AB Tasty
├── models/               # Modèles de données partagés
├── tests/                # Tests unitaires et d'intégration
└── main.py               # Point d'entrée de l'application
```

### Architecture modulaire

L'architecture a été conçue pour être modulaire et extensible:

1. **Séparation des préoccupations** : Chaque fichier a une responsabilité unique
   - `router.py` : Contient uniquement les définitions de routes
   - `models.py` : Définit les modèles de données d'entrée/sortie
   - `service.py` : Contient la logique métier

2. **Abstraction pour les services externes** : La classe abstraite `ExternalService` permet d'ajouter facilement de nouveaux services API:
   - Implémentez simplement l'interface pour ajouter d'autres outils comme VWO, Google Optimize, etc.
   - Standardisation des données entre différentes plateformes

3. **Gestion des configurations** : Le module `core/auth.py` centralise la gestion des clés API
   - Les clés sont récupérées depuis un fichier de configuration séparé
   - Sécurité améliorée avec les dépendances FastAPI

4. **Import de données flexibles** : Le module `imports.py` permet l'importation de données au format CSV
   - Validation des champs requis
   - Gestion des erreurs d'encodage et de format

Cette architecture modulaire facilite considérablement l'extension des fonctionnalités et la maintenance du code à long terme.

## Testing

Run the test suite:

```bash
pytest
```

## License

MIT 