import pickle
import numpy as np
import pandas as pd
from typing import List, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from transformers import pipeline
import joblib
import os

from app.models.transaction import TransactionCategory


class TransactionCategorizer:
    """
    AI-powered transaction categorization using machine learning
    """
    
    def __init__(self, model_path: str = "models/transaction_categorizer.pkl"):
        self.model_path = model_path
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2),
            lowercase=True
        )
        self.classifier = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight='balanced'
        )
        self.is_trained = False
        self.categories = [category.value for category in TransactionCategory]
        
        # Load pre-trained model if exists
        self.load_model()
    
    def preprocess_text(self, description: str, merchant: str = None) -> str:
        """
        Preprocess transaction description and merchant name
        """
        text = description.lower().strip()
        if merchant:
            text += f" {merchant.lower().strip()}"
        
        # Remove common payment processing terms
        remove_terms = [
            'payment', 'purchase', 'transaction', 'debit', 'credit',
            'pos', 'atm', 'withdrawal', 'deposit', 'transfer'
        ]
        
        for term in remove_terms:
            text = text.replace(term, '')
        
        return text.strip()
    
    def create_features(self, transactions_df: pd.DataFrame) -> np.ndarray:
        """
        Create features from transaction data
        """
        # Combine description and merchant for text features
        text_features = transactions_df.apply(
            lambda row: self.preprocess_text(
                row['description'], 
                row.get('merchant_name', '')
            ), 
            axis=1
        )
        
        # Vectorize text features
        if not hasattr(self.vectorizer, 'vocabulary_'):
            # First time training
            tfidf_features = self.vectorizer.fit_transform(text_features)
        else:
            # Using existing vocabulary
            tfidf_features = self.vectorizer.transform(text_features)
        
        return tfidf_features.toarray()
    
    def train(self, transactions_df: pd.DataFrame) -> dict:
        """
        Train the categorization model
        """
        if len(transactions_df) < 50:
            raise ValueError("Need at least 50 transactions to train the model")
        
        # Create features
        X = self.create_features(transactions_df)
        y = transactions_df['category'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train classifier
        self.classifier.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        self.is_trained = True
        self.save_model()
        
        return {
            'accuracy': accuracy,
            'classification_report': classification_report(y_test, y_pred),
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
    
    def predict(self, description: str, merchant_name: str = None, amount: float = None) -> Tuple[str, float]:
        """
        Predict transaction category
        """
        if not self.is_trained:
            # Return default category with low confidence
            return TransactionCategory.UNCATEGORIZED.value, 0.0
        
        # Preprocess input
        text = self.preprocess_text(description, merchant_name)
        
        # Create feature vector
        text_vector = self.vectorizer.transform([text]).toarray()
        
        # Predict
        prediction = self.classifier.predict(text_vector)[0]
        confidence = max(self.classifier.predict_proba(text_vector)[0])
        
        return prediction, confidence
    
    def predict_batch(self, transactions: List[dict]) -> List[Tuple[str, float]]:
        """
        Predict categories for multiple transactions
        """
        if not self.is_trained:
            return [(TransactionCategory.UNCATEGORIZED.value, 0.0) for _ in transactions]
        
        # Create DataFrame
        df = pd.DataFrame(transactions)
        
        # Create features
        X = self.create_features(df)
        
        # Predict
        predictions = self.classifier.predict(X)
        probabilities = self.classifier.predict_proba(X)
        confidences = [max(prob) for prob in probabilities]
        
        return list(zip(predictions, confidences))
    
    def retrain_with_feedback(self, transaction_data: dict, correct_category: str):
        """
        Retrain model with user feedback
        """
        # This would typically involve updating the training dataset
        # and retraining the model periodically
        pass
    
    def get_feature_importance(self) -> dict:
        """
        Get feature importance for model interpretability
        """
        if not self.is_trained:
            return {}
        
        feature_names = self.vectorizer.get_feature_names_out()
        importances = self.classifier.feature_importances_
        
        # Get top 20 most important features
        top_indices = np.argsort(importances)[-20:]
        top_features = {
            feature_names[i]: importances[i] 
            for i in top_indices
        }
        
        return dict(sorted(top_features.items(), key=lambda x: x[1], reverse=True))
    
    def save_model(self):
        """
        Save trained model to disk
        """
        if not self.is_trained:
            return
        
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        model_data = {
            'vectorizer': self.vectorizer,
            'classifier': self.classifier,
            'is_trained': self.is_trained,
            'categories': self.categories
        }
        
        with open(self.model_path, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load_model(self):
        """
        Load trained model from disk
        """
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    model_data = pickle.load(f)
                
                self.vectorizer = model_data['vectorizer']
                self.classifier = model_data['classifier']
                self.is_trained = model_data['is_trained']
                self.categories = model_data.get('categories', self.categories)
                
            except Exception as e:
                print(f"Error loading model: {e}")
                self.is_trained = False


class HuggingFaceCategorizer:
    """
    Alternative categorizer using Hugging Face transformers
    """
    
    def __init__(self):
        self.classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli"
        )
        self.categories = [
            "groceries and food", "restaurants and dining", "transportation and gas",
            "shopping and retail", "utilities and bills", "entertainment",
            "healthcare and medical", "financial services", "travel",
            "education", "charity and donations", "other expenses"
        ]
    
    def predict(self, description: str, merchant_name: str = None) -> Tuple[str, float]:
        """
        Predict category using zero-shot classification
        """
        text = f"{description}"
        if merchant_name:
            text += f" at {merchant_name}"
        
        result = self.classifier(text, self.categories)
        
        # Map to our category enum
        predicted_label = result['labels'][0]
        confidence = result['scores'][0]
        
        # Simple mapping (in production, you'd want a more sophisticated mapping)
        category_mapping = {
            "groceries and food": TransactionCategory.GROCERIES.value,
            "restaurants and dining": TransactionCategory.RESTAURANTS.value,
            "transportation and gas": TransactionCategory.GAS.value,
            "shopping and retail": TransactionCategory.GENERAL_MERCHANDISE.value,
            "utilities and bills": TransactionCategory.UTILITIES.value,
            "entertainment": TransactionCategory.MOVIES.value,
            "healthcare and medical": TransactionCategory.MEDICAL.value,
            "financial services": TransactionCategory.BANK_FEES.value,
            "travel": TransactionCategory.TRAVEL.value,
            "education": TransactionCategory.EDUCATION.value,
            "charity and donations": TransactionCategory.CHARITY.value,
            "other expenses": TransactionCategory.UNCATEGORIZED.value,
        }
        
        mapped_category = category_mapping.get(predicted_label, TransactionCategory.UNCATEGORIZED.value)
        
        return mapped_category, confidence


# Global instances for real ML categorization
_ml_categorizer = TransactionCategorizer()
_hf_categorizer = None  # Initialize lazily to avoid startup issues

def categorize_transaction(description: str, merchant_name: str = "", categories: list = None) -> str:
    """
    Real ML-powered transaction categorization function
    Uses both traditional ML and transformer models for accurate categorization
    """
    global _hf_categorizer
    
    try:
        # First try the traditional ML model if it's trained
        if _ml_categorizer.is_trained:
            category, confidence = _ml_categorizer.predict(description, merchant_name)
            if confidence > 0.7:  # High confidence threshold
                return category
        
        # Lazy initialization of HuggingFace categorizer
        if _hf_categorizer is None:
            try:
                _hf_categorizer = HuggingFaceCategorizer()
            except Exception as e:
                print(f"Could not initialize HuggingFace categorizer: {e}")
                return TransactionCategory.UNCATEGORIZED.value
        
        # Fallback to Hugging Face transformer model for zero-shot classification
        category, confidence = _hf_categorizer.predict(description, merchant_name)
        if confidence > 0.5:  # Reasonable confidence threshold
            return category
        
        # If both models have low confidence, return uncategorized
        return TransactionCategory.UNCATEGORIZED.value
            
    except Exception as e:
        print(f"Error in ML categorization: {e}")
        # Emergency fallback - return uncategorized rather than crash
        return TransactionCategory.UNCATEGORIZED.value
