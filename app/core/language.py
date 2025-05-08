"""
Module de détection et gestion des langues.
Utilise langdetect pour identifier la langue des messages utilisateur.
"""

from langdetect import detect, LangDetectException
import re

# Mapping des langues détectées vers les codes standard
LANGUAGE_MAPPING = {
    'en': 'english',
    'fr': 'french',
    'es': 'spanish',
    'de': 'german',
    'it': 'italian',
    'pt': 'portuguese',
    'nl': 'dutch',
    'ru': 'russian',
    'zh-cn': 'chinese',
    'ja': 'japanese'
}

# Langues supportées avec un support complet dans l'application
FULLY_SUPPORTED_LANGUAGES = ['en', 'fr', 'es', 'de']

def detect_language(text: str) -> str:
    """
    Détecte la langue du texte fourni en utilisant langdetect.
    
    Args:
        text (str): Le texte à analyser
        
    Returns:
        str: Code de langue ISO (en, fr, es, de, etc.) ou 'en' par défaut
    """
    try:
        # Essayer d'abord avec langdetect
        lang = detect(text)
        
        # Retourner la langue si elle est complètement supportée, sinon revenir à l'anglais
        return lang if lang in FULLY_SUPPORTED_LANGUAGES else 'en'
    except LangDetectException:
        # Fallback: détection basée sur des expressions régulières de mots courants
        return detect_language_by_keywords(text)

def detect_language_by_keywords(text: str) -> str:
    """
    Détecte la langue en recherchant des mots courants.
    Méthode de fallback si langdetect échoue.
    
    Args:
        text (str): Le texte à analyser
        
    Returns:
        str: Code de langue ISO (en, fr, es, de) ou 'en' par défaut
    """
    text = text.lower()
    
    # Mots communs en français
    if re.search(r'\b(le|la|les|un|une|des|et|est|sont|dans|pour|avec|sur|que|qui|quoi|ce|cette|ces|votre|vous|nous|je|tu|il|elle|ils|elles)\b', text):
        return 'fr'
    
    # Mots communs en espagnol
    elif re.search(r'\b(el|la|los|las|un|una|unos|unas|y|es|son|en|para|con|sobre|que|quien|este|esta|estos|estas|tu|usted|yo|nosotros|ellos|ellas)\b', text):
        return 'es'
    
    # Mots communs en allemand
    elif re.search(r'\b(der|die|das|ein|eine|und|ist|sind|in|für|mit|auf|dass|wer|was|dieser|diese|dieses|du|sie|ich|wir)\b', text):
        return 'de'
    
    # Par défaut, anglais
    else:
        return 'en'

def get_language_name(lang_code: str) -> str:
    """
    Retourne le nom complet de la langue à partir de son code.
    
    Args:
        lang_code (str): Code ISO de la langue (en, fr, es, de, etc.)
        
    Returns:
        str: Nom complet de la langue
    """
    return LANGUAGE_MAPPING.get(lang_code, 'english')

def get_thinking_text(lang_code: str) -> str:
    """
    Retourne le texte "thinking" adapté à la langue détectée.
    
    Args:
        lang_code (str): Code de langue ISO (en, fr, es, de, etc.)
        
    Returns:
        str: Texte approprié pour l'indicateur de réflexion
    """
    thinking_texts = {
        'en': 'Thinking',
        'fr': 'Réflexion en cours',
        'es': 'Pensando',
        'de': 'Nachdenken',
        'it': 'Pensando',
        'pt': 'Pensando',
        'nl': 'Denken',
        'ru': 'Размышление',
        'zh-cn': '思考中',
        'ja': '考え中'
    }
    
    return thinking_texts.get(lang_code, 'Thinking') 