import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns

class SpendingPredictor:
    def __init__(self):
        self.data = None
        self.model = None
        self.scaler = StandardScaler()
        
    def load_data(self, file_path):
        """
        Load the CSV data file
        """
        try:
            self.data = pd.read_csv(file_path)
            print("Data loaded successfully!")
            print("\nFirst few rows of the data:")
            print(self.data.head())
            print("\nData Info:")
            print(self.data.info())
        except Exception as e:
            print(f"Error loading data: {e}")
            
    def preprocess_data(self):
        """
        Preprocess the data: handle missing values, convert dates, etc.
        """
        # Convert year to datetime if not already
        if 'year' in self.data.columns:
            self.data['year'] = pd.to_datetime(self.data['year'], format='%Y')
            
        # Check for missing values
        print("\nMissing values:")
        print(self.data.isnull().sum())
        
        # Handle missing values if any
        self.data = self.data.fillna(self.data.mean())
        
    def explore_data(self):
        """
        Perform exploratory data analysis
        """
        plt.figure(figsize=(12, 6))
        
        # Plot total spending trend
        plt.subplot(1, 2, 1)
        plt.plot(self.data['year'], self.data['total_spending'], marker='o')
        plt.title('Total Spending Over Time')
        plt.xlabel('Year')
        plt.ylabel('Total Spending')
        
        # Plot average spend trend
        plt.subplot(1, 2, 2)
        plt.plot(self.data['year'], self.data['avg_spend'], marker='o', color='green')
        plt.title('Average Spend Over Time')
        plt.xlabel('Year')
        plt.ylabel('Average Spend')
        
        plt.tight_layout()
        plt.show()
        
        # Calculate correlation matrix
        correlation = self.data.corr()
        plt.figure(figsize=(10, 8))
        sns.heatmap(correlation, annot=True, cmap='coolwarm')
        plt.title('Correlation Matrix')
        plt.show()
        
    def prepare_features(self):
        """
        Prepare features for model training
        """
        # Create features (X) and target (y)
        # Using year as numeric value for prediction
        X = self.data['year'].dt.year.values.reshape(-1, 1)
        y_total = self.data['total_spending'].values
        y_avg = self.data['avg_spend'].values
        
        # Scale the features
        X_scaled = self.scaler.fit_transform(X)
        
        return X_scaled, y_total, y_avg
        
    def train_model(self, X, y):
        """
        Train the prediction model
        """
        # Split data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Initialize and train the model
        self.model = LinearRegression()
        self.model.fit(X_train, y_train)
        
        # Make predictions on test set
        y_pred = self.model.predict(X_test)
        
        # Calculate metrics
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print("\nModel Performance:")
        print(f"Mean Squared Error: {mse:.2f}")
        print(f"R² Score: {r2:.2f}")
        
        return X_test, y_test, y_pred
        
    def predict_future(self, future_years):
        """
        Predict future values
        """
        if self.model is None:
            print("Error: Model not trained yet!")
            return
            
        # Create future years array
        last_year = self.data['year'].dt.year.max()
        future_years_array = np.array(range(last_year + 1, last_year + future_years + 1))
        future_years_scaled = self.scaler.transform(future_years_array.reshape(-1, 1))
        
        # Make predictions
        predictions = self.model.predict(future_years_scaled)
        
        return future_years_array, predictions

def main():
    # Initialize predictor
    predictor = SpendingPredictor()
    
    # Load data
    predictor.load_data('C:\Users\laksh\AppData\Local\Microsoft\Windows\INetCache\IE\FGUV9A0I\cleaned_drug_data[2].csv')  # Replace with your CSV file path
    
    # Preprocess data
    predictor.preprocess_data()
    
    # Explore data
    predictor.explore_data()
    
    # Prepare features and train models
    X_scaled, y_total, y_avg = predictor.prepare_features()
    
    print("\nTraining model for Total Spending:")
    predictor.train_model(X_scaled, y_total)
    
    print("\nTraining model for Average Spend:")
    predictor.train_model(X_scaled, y_avg)
    
    # Predict future values (e.g., next 3 years)
    future_years, predictions = predictor.predict_future(3)
    
    print("\nPredictions for future years:")
    for year, pred in zip(future_years, predictions):
        print(f"Year {year}: {pred:.2f}")

if __name__ == "__main__":
    main()