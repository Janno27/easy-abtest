import re
from typing import List, Dict, Any

def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Extrait les données structurées (tableaux, graphiques) du texte markdown.
    
    Args:
        text (str): Le texte markdown à analyser
        
    Returns:
        Dict[str, Any]: Dictionnaire avec les éléments structurés extraits
    """
    # Initialiser le conteneur de données structurées
    structured_data = {
        "tables": extract_markdown_tables(text),
        "buttons": [
            {"type": "button", "text": "Calculer taille d'échantillon", "action": "calculate_sample_size"}
        ]
    }
    
    return structured_data

def extract_markdown_tables(text: str) -> List[Dict[str, Any]]:
    """
    Extrait les tableaux markdown du texte.
    
    Args:
        text (str): Le texte markdown à analyser
        
    Returns:
        List[Dict[str, Any]]: Liste des tableaux extraits
    """
    tables = []
    
    # Recherche des tableaux markdown
    table_pattern = r'\|(.+?)\|[\r\n]+\|([-:| ]+)\|[\r\n]+((?:\|.+\|[\r\n]+)+)'
    
    matches = re.finditer(table_pattern, text, re.DOTALL)
    
    for i, match in enumerate(matches):
        try:
            # Extraire les en-têtes, séparateurs et lignes
            headers_raw = match.group(1).strip()
            separators = match.group(2).strip()
            rows_raw = match.group(3).strip()
            
            # Transformer les en-têtes en liste
            headers = [h.strip() for h in headers_raw.split('|') if h.strip()]
            
            # Extraire les alignements à partir des séparateurs
            alignments = []
            for sep in separators.split('|'):
                sep = sep.strip()
                if sep.startswith(':') and sep.endswith(':'):
                    alignments.append('center')
                elif sep.endswith(':'):
                    alignments.append('right')
                else:
                    alignments.append('left')
            
            # Transformer les lignes en liste de dictionnaires
            rows = []
            for row in rows_raw.split('\n'):
                if not row.strip() or '|' not in row:
                    continue
                    
                cols = [col.strip() for col in row.strip().split('|')[1:-1]]
                if cols and len(cols) == len(headers):
                    row_dict = {headers[j]: cols[j] for j in range(len(headers))}
                    rows.append(row_dict)
            
            # Ajouter le tableau formaté
            tables.append({
                "id": f"table_{i+1}",
                "headers": headers,
                "rows": rows,
                "alignments": alignments
            })
        except Exception as e:
            print(f"Error extracting table: {str(e)}")
            continue
    
    return tables 