#!/usr/bin/env python3
"""
Predict Stock Signals using Trained Model

This script loads a trained model and generates predictions for new data.

Usage:
    python3 predict.py --model model.joblib --features '[...]' --output prediction.json
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import joblib


def load_model(model_path: str):
    """Load trained model and scaler"""
    model_data = joblib.load(model_path)
    return model_data['model'], model_data['scaler'], model_data.get('metadata', {})


def predict_signal(model, scaler, features: list):
    """Generate prediction for feature vector"""
    # Convert to numpy array and reshape
    X = np.array(features).reshape(1, -1)

    # Scale features
    X_scaled = scaler.transform(X)

    # Predict
    prediction = model.predict(X_scaled)[0]
    probabilities = model.predict_proba(X_scaled)[0]

    # Map to labels
    label_map = {0: 'sell', 1: 'hold', 2: 'buy'}
    signal = label_map.get(prediction, 'hold')

    # Get confidence (max probability)
    confidence = float(np.max(probabilities))

    # Map probabilities to labels
    probs_dict = {
        'buy': float(probabilities[2]),
        'hold': float(probabilities[1]),
        'sell': float(probabilities[0])
    }

    return {
        'signal': signal,
        'confidence': confidence,
        'probabilities': probs_dict
    }


def main():
    parser = argparse.ArgumentParser(description='Predict stock signals using trained model')
    parser.add_argument('--model', required=True, help='Path to trained model file')
    parser.add_argument('--features', required=True, help='Feature vector as JSON array')
    parser.add_argument('--output', help='Output file for prediction (JSON)')

    args = parser.parse_args()

    try:
        # Load model
        print(f"Loading model from {args.model}...", file=sys.stderr)
        model, scaler, metadata = load_model(args.model)

        if metadata:
            print(f"Model metadata: {metadata}", file=sys.stderr)

        # Parse features
        features = json.loads(args.features)

        if len(features) != 13:
            print(f"Warning: Expected 13 features, got {len(features)}", file=sys.stderr)

        # Generate prediction
        result = predict_signal(model, scaler, features)

        # Output
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"Prediction saved to {args.output}", file=sys.stderr)
        else:
            print(json.dumps(result))

        sys.exit(0)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
