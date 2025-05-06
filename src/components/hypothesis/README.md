# A/B Test Hypothesis Assistant

Ce module fournit une interface de chat interactive qui aide les utilisateurs à formuler des hypothèses structurées pour les tests A/B en suivant les meilleures pratiques du secteur.

## Objectif

L'assistant d'hypothèse aide les utilisateurs à :
- Structurer correctement leurs hypothèses de test A/B
- Suivre le format standard : "Si [changement], alors [métrique] [impact] parce que [mécanisme], mesuré via [méthode]"
- Se concentrer sur le problème sous-jacent et la conception de test appropriée
- Appliquer les meilleures pratiques du secteur

## Architecture

### Composants Frontend
- `HypothesisAssistant.tsx` : Composant principal qui gère l'état de la conversation
- `ChatPrompt.tsx` : Composant d'entrée avec animations et zone de texte à expansion automatique
- `ChatFlow.tsx` : Composant qui affiche la conversation avec des bulles de message animées
- `GradientBorderEffect.tsx` : Composant UI réutilisable pour les effets visuels

### Fonctionnalités
- Conteneur pleine hauteur pour utiliser l'espace d'écran disponible
- Animations fluides pour l'envoi et la réception de messages
- Défilement automatique vers les derniers messages
- Design responsive pour toutes tailles d'écran
- Horodatage des messages
- États de chargement
- Sélection du modèle LLM (Llama 3, Deepseek, Deepseek Reasoner)

### Intégration Backend
- Intégration avec l'API Hugging Face pour Llama 3
- Intégration directe avec l'API Deepseek pour Deepseek et Deepseek Reasoner
- Endpoint FastAPI avec limitation de débit (10 requêtes/min)
- Conversation guidée par étapes pour formuler des hypothèses précises

## Processus d'élaboration d'hypothèse

L'assistant utilise une approche méthodique en plusieurs étapes pour aider à élaborer une hypothèse de test A/B solide :

1. **Écoute du problème initial**
   - L'utilisateur décrit son problème (ex: "Le taux de conversion a baissé sur ma page produit")
   - L'assistant évalue le niveau de détail et commence à guider la conversation

2. **Collecte d'informations structurée**
   - Pose des questions pertinentes une par une :
     - Page ou fonctionnalité spécifique concernée
     - URL de la page (si applicable)
     - Métriques actuellement suivies
     - Éléments déjà identifiés comme problématiques
     - Objectif principal (conversions, engagement, revenus)

3. **Formulation de l'hypothèse**
   - Une fois les informations suffisantes recueillies, l'assistant formule une hypothèse structurée
   - Format: "Si [changement spécifique], alors [métrique] [augmentera/diminuera] de [estimation] parce que [mécanisme], mesuré via [méthode]"

4. **Présentation structurée**
   - L'hypothèse est présentée de manière claire avec des sections distinctes
   - Utilisation du formatage markdown pour faciliter la lecture
   - Résumé des informations recueillies

## Modèles LLM disponibles

L'assistant prend en charge trois modèles de langage différents :

1. **Llama 3** (via API Hugging Face)
   - Modèle général de haute qualité
   - Bon équilibre entre performance et rapidité

2. **Deepseek** (via API Deepseek)
   - Modèle optimisé pour les tâches conversationnelles
   - Excellente compréhension du contexte métier

3. **Deepseek Reasoner** (via API Deepseek)
   - Spécialisé dans le raisonnement complexe
   - Recommandé pour les hypothèses nécessitant une analyse approfondie

## Structure des données

### Format des messages
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

### Format d'hypothèse structurée
```typescript
interface StructuredHypothesis {
  change: string;       // Le changement testé
  metric: string;       // Métrique observée
  impact: string;       // Impact attendu (augmentation/diminution/etc)
  mechanism: string;    // Raison/explication
  method: string;       // Méthode de mesure
}
```

## Flux utilisateur

1. L'utilisateur est invité à décrire son problème initial
2. Lors de la soumission du premier message :
   - Le message s'anime vers le haut
   - L'invite initiale disparaît
   - L'interface de chat apparaît avec le message de l'utilisateur
   - L'assistant IA répond avec une première question de clarification
3. La conversation se poursuit avec l'entrée toujours positionnée en bas
4. L'assistant pose des questions précises, une à la fois
5. Une fois suffisamment d'informations recueillies, l'assistant formule une hypothèse structurée complète

## Configuration requise

Pour utiliser pleinement cette fonctionnalité, le backend doit être configuré avec les clés API appropriées :

```
# Hugging Face pour Llama 3
HF_API_KEY=your_huggingface_api_key
HF_LLAMA_MODEL=meta-llama/Llama-3.3-70B-Instruct

# Deepseek pour Deepseek et Deepseek Reasoner
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

## Avantages clés

- **Approche méthodique** : Guide l'utilisateur étape par étape vers une hypothèse solide
- **Format standardisé** : Assure la cohérence et la clarté des hypothèses
- **Conversation naturelle** : Interface conversationnelle fluide et intuitive
- **Flexibilité des modèles** : Choix entre différents modèles LLM selon les besoins
- **Design responsive** : Fonctionne sur tous les appareils et tailles d'écran 