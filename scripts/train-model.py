#!/usr/bin/env python3
"""
Train ML Model for Stock Price Prediction

This script trains a RandomForest classifier to predict buy/hold/sell signals
using technical indicators as features.

Usage:
    python3 train-model.py --input training-data.json --output model.joblib
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib


def load_data(input_file: str):
    """Load training data from JSON file"""
    with open(input_file, 'r') as f:
        data = json.load(f)

    features = np.array(data['features'])
    labels = np.array(data['labels'])

    print(f"Loaded {len(features)} samples")
    print(f"Feature shape: {features.shape}")
    print(f"Label distribution: Buy={sum(labels==1)}, Hold={sum(labels==0)}, Sell={sum(labels==-1)}")

    return features, labels


def train_model(X_train, y_train):
    """Train RandomForest classifier with hyperparameter tuning"""
    print("\n=== Training Model ===")

    # RandomForest with good hyperparameters
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=10,
        min_samples_leaf=5,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'
    )

    # Train
    model.fit(X_train, y_train)

    print("✓ Model training complete")
    return model


def evaluate_model(model, X_test, y_test):
    """Evaluate model performance"""
    print("\n=== Evaluating Model ===")

    # Predictions
    y_pred = model.predict(X_test)

    # Accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")

    # Classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Sell', 'Hold', 'Buy']))

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    print("\nConfusion Matrix:")
    print(cm)

    # Cross-validation
    print("\n=== Cross-Validation ===")
    cv_scores = cross_val_score(model, X_test, y_test, cv=5, scoring='accuracy')
    print(f"CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    # Feature importance
    feature_names = [
        'ma20_ma50',
        'rsi',
        'macd',
        'macd_signal',
        'macd_histogram',
        'bb_upper',
        'bb_middle',
        'bb_lower',
        'obv',
        'ichi_tenkan',
        'ichi_kijun',
        'ichi_senkou_a',
        'ichi_senkou_b'
    ]

    importance = model.feature_importances_
    feature_importance = dict(zip(feature_names, importance))

    print("\n=== Feature Importance ===")
    sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    for name, score in sorted_features:
        print(f"  {name}: {score:.4f}")

    return {
        'accuracy': accuracy,
        'feature_importance': feature_importance
    }


def save_model(model, scaler, output_path: str):
    """Save trained model and scaler"""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save model
    model_data = {
        'model': model,
        'scaler': scaler,
        'metadata': {
            'trained_at': datetime.now().isoformat(),
            'model_type': 'RandomForestClassifier',
            'version': '1.0.0'
        }
    }

    joblib.dump(model_data, output_path)
    print(f"\n✓ Model saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description='Train ML model for stock prediction')
    parser.add_argument('--input', required=True, help='Input JSON file with training data')
    parser.add_argument('--output', required=True, help='Output path for trained model')
    parser.add_argument('--test-size', type=float, default=0.2, help='Test set size (default: 0.2)')

    args = parser.parse_args()

    try:
        # Load data
        X, y = load_data(args.input)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=args.test_size, random_state=42, stratify=y
        )

        print(f"\nTrain set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")

        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Train model
        model = train_model(X_train_scaled, y_train)

        # Evaluate
        metrics = evaluate_model(model, X_test_scaled, y_test)

        # Save model
        save_model(model, scaler, args.output)

        # Print final results
        print("\n=== Training Complete ===")
        print(f"Accuracy: {metrics['accuracy']:.4f}")
        print(f"Feature Importance: {json.dumps(metrics['feature_importance'], indent=2)}")

        # Exit with success
        sys.exit(0)

    except Exception as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
