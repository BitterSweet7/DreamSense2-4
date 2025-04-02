import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import logging
import re
from typing import List, Dict, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DreamDictionaryRAG:
    def __init__(self, csv_path: str):
        """Initialize the RAG system with the dream dictionary CSV."""
        try:
            self.df = pd.read_csv(csv_path)
            logger.info(f"Loaded dream dictionary with {len(self.df)} entries")
            
            # Preprocess terms to lowercase for better matching
            self.df['Term_lower'] = self.df['Term'].str.lower()
            
            # Combine Term, Details, and Summary for better matching
            self.df['combined'] = self.df['Term'] + " " + self.df['Details'] + " " + self.df['Summary']
            
            # Initialize TF-IDF vectorizer
            self.vectorizer = TfidfVectorizer(stop_words='english')
            self.tfidf_matrix = self.vectorizer.fit_transform(self.df['combined'])
            
            logger.info("TF-IDF vectorization completed")
        except Exception as e:
            logger.error(f"Error initializing dream dictionary RAG: {e}")
            raise

    def retrieve_relevant_entries(self, query: str, top_k: int = 5) -> List[Dict]:
        """Retrieve the most relevant dream dictionary entries for a query."""
        try:
            # Vectorize the query
            query_vec = self.vectorizer.transform([query])
            
            # Calculate similarity scores
            similarity_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
            
            # Get top-k indices
            top_indices = similarity_scores.argsort()[-top_k:][::-1]
            
            # Return relevant entries
            relevant_entries = []
            for idx in top_indices:
                if similarity_scores[idx] > 0.01:  # Threshold to ensure some relevance
                    relevant_entries.append({
                        'term': self.df.iloc[idx]['Term'],
                        'details': self.df.iloc[idx]['Details'],
                        'summary': self.df.iloc[idx]['Summary'],
                        'score': float(similarity_scores[idx])
                    })
            
            return relevant_entries
        except Exception as e:
            logger.error(f"Error retrieving relevant entries: {e}")
            return []

    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract potential dream symbols from the input text."""
        try:
            # Normalize text
            text_lower = text.lower()
            
            # Extract words and phrases (1-3 words)
            words = re.findall(r'\b\w+\b', text_lower)
            bigrams = [words[i] + ' ' + words[i+1] for i in range(len(words)-1)]
            trigrams = [words[i] + ' ' + words[i+1] + ' ' + words[i+2] for i in range(len(words)-2)]
            
            all_potential_terms = words + bigrams + trigrams
            
            # Direct term matching with the dictionary
            matched_terms = []
            for term_lower in self.df['Term_lower']:
                if term_lower in text_lower:
                    # Get the original term with proper capitalization
                    original_term = self.df.loc[self.df['Term_lower'] == term_lower, 'Term'].iloc[0]
                    matched_terms.append(original_term)
            
            # If we found direct matches, prioritize those
            if matched_terms:
                return matched_terms[:max_keywords]
            
            # Otherwise, find terms that might be related to words in the dream
            keywords = []
            for potential_term in all_potential_terms:
                # Skip very short terms and common words
                if len(potential_term) <= 3 or potential_term in ['the', 'and', 'was', 'were', 'that', 'this', 'with', 'for', 'about']:
                    continue
                    
                # Check if any dictionary term contains this word
                for i, row in self.df.iterrows():
                    term = row['Term_lower']
                    if potential_term in term or term in potential_term:
                        keywords.append(row['Term'])
                        break
                        
                if len(keywords) >= max_keywords:
                    break
            
            return list(set(keywords))  # Remove duplicates
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return []

    def direct_term_lookup(self, text: str) -> List[Dict]:
        """Directly look up terms that appear in the text."""
        matches = []
        text_lower = text.lower()
        
        for i, row in self.df.iterrows():
            term_lower = row['Term_lower']
            if term_lower in text_lower:
                matches.append({
                    'term': row['Term'],
                    'details': row['Details'],
                    'summary': row['Summary'],
                    'score': 1.0  # Direct matches get highest score
                })
        
        return matches

    def generate_context(self, dream_text: str) -> Tuple[str, List[Dict]]:
        """Generate context for the LLM based on the dream text."""
        try:
            # First try direct lookup for exact term matches
            direct_matches = self.direct_term_lookup(dream_text)
            
            if direct_matches:
                logger.info(f"Found {len(direct_matches)} direct term matches in the dream")
                all_entries = direct_matches
            else:
                # Extract keywords
                keywords = self.extract_keywords(dream_text)
                logger.info(f"Extracted keywords: {keywords}")
                
                # Retrieve relevant entries for the entire dream text
                text_entries = self.retrieve_relevant_entries(dream_text, top_k=3)
                
                # Also retrieve entries for each keyword
                keyword_entries = []
                for keyword in keywords:
                    entries = self.retrieve_relevant_entries(keyword, top_k=1)
                    keyword_entries.extend(entries)
                
                # Combine entries
                all_entries = text_entries + keyword_entries
            
            # Deduplicate entries
            unique_entries = []
            seen_terms = set()
            
            for entry in all_entries:
                if entry['term'] not in seen_terms:
                    unique_entries.append(entry)
                    seen_terms.add(entry['term'])
            
            # Sort by relevance score
            unique_entries.sort(key=lambda x: x['score'], reverse=True)
            
            # Limit to top entries to avoid context length issues
            top_entries = unique_entries[:5]
            
            # Format context for LLM
            context = "Dream Dictionary References:\n\n"
            for entry in top_entries:
                context += f"Symbol: {entry['term']}\n"
                context += f"Meaning: {entry['details']}\n\n"
            
            logger.info(f"Generated context with {len(top_entries)} dream symbols")
            return context, top_entries
        except Exception as e:
            logger.error(f"Error generating context: {e}")
            return "No relevant dream symbols found.", []
