import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import json
import logging
from flask import Flask, jsonify
from flask_cors import CORS

class DrugSpendingPredictor:
    def __init__(self):
        """Initialize the DrugSpendingPredictor."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('drug_predictor.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.data = None
        self.models_total = {}
        self.models_avg = {}

    def load_local_data(self, file_path='drug_data.json'):
        """Load data from local JSON file."""
        self.logger.info(f"Loading data from: {file_path}")
        
        try:
            with open(file_path, 'r') as file:
                json_data = json.load(file)
                self.data = pd.DataFrame(json_data)
                self.logger.info(f"Successfully loaded {len(self.data)} records")
                return True
        except FileNotFoundError:
            self.logger.error(f"File not found: {file_path}")
            return False
        except json.JSONDecodeError:
            self.logger.error("Error decoding JSON file")
            return False
        except Exception as e:
            self.logger.error(f"Error loading data: {e}")
            return False

    def preprocess_data(self):
        """Clean and prepare the data for analysis."""
        if self.data is None:
            self.logger.error("No data to preprocess")
            return False
            
        try:
            numeric_columns = [col for col in self.data.columns if col.startswith('Tot_Spndng_') or col.startswith('Avg_Spnd_Per_Bene_')]
            
            for col in numeric_columns:
                self.data[col] = pd.to_numeric(self.data[col], errors='coerce')

            self.data[numeric_columns] = self.data[numeric_columns].fillna(self.data[numeric_columns].mean())
            self.logger.info("Data preprocessing completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error during preprocessing: {e}")
            return False

    def train_models(self):
        """Train prediction models for each unique drug."""
        if self.data is None:
            self.logger.error("No data available for training")
            return False

        years = np.array(range(2018, 2023)).reshape(-1, 1)
        success_count = 0
        
        for _, drug in self.data.iterrows():
            drug_name = drug['Brnd_Name']
            
            try:
                total_spending = np.array([float(drug[f'Tot_Spndng_{year}']) for year in range(2018, 2023)])
                avg_spending = np.array([float(drug[f'Avg_Spnd_Per_Bene_{year}']) for year in range(2018, 2023)])

                model_total = LinearRegression().fit(years, total_spending)
                model_avg = LinearRegression().fit(years, avg_spending)

                self.models_total[drug_name] = model_total
                self.models_avg[drug_name] = model_avg
                
                success_count += 1
                
            except Exception as e:
                self.logger.error(f"Error training models for {drug_name}: {e}")
                
        self.logger.info(f"Successfully trained models for {success_count} drugs")
        return success_count > 0

    def predict_future(self, years_ahead=3):
        """Make predictions for future years."""
        if not self.models_total:
            self.logger.error("No trained models available")
            return None

        future_years = np.array(range(2023, 2023 + years_ahead)).reshape(-1, 1)
        predictions = {}

        for drug_name in self.models_total.keys():
            try:
                total_predictions = self.models_total[drug_name].predict(future_years).tolist()
                avg_predictions = self.models_avg[drug_name].predict(future_years).tolist()

                predictions[drug_name] = {
                    'years': list(range(2023, 2023 + years_ahead)),
                    'total_spending': total_predictions,
                    'avg_spending': avg_predictions
                }

            except Exception as e:
                self.logger.error(f"Prediction error for {drug_name}: {e}")
                
        return predictions

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Requests

predictor = DrugSpendingPredictor()

@app.route('/load_data', methods=['GET'])
def load_data():
    """Load and preprocess data."""
    if predictor.load_local_data() and predictor.preprocess_data():
        return jsonify({"message": "Data loaded successfully"}), 200
    return jsonify({"error": "Failed to load data"}), 500

@app.route('/train_models', methods=['GET'])
def train_models():
    """Train the prediction models."""
    if predictor.train_models():
        return jsonify({"message": "Models trained successfully"}), 200
    return jsonify({"error": "Model training failed"}), 500

@app.route('/predict', methods=['GET'])
def predict():
    """Return predictions as JSON."""
    predictions = predictor.predict_future(3)
    if predictions:
        return jsonify(predictions), 200
    return jsonify({"error": "Prediction failed"}), 500

if __name__ == '__main__':
    app.run(debug=True)
