# app.py
from flask import Flask, render_template, jsonify
import pandas as pd
import requests
import time
from functools import lru_cache

app = Flask(__name__)

@app.route('/excluded_data')
def excluded_data():
    return "Excluded Data Page"  # Replace this with `render_template('excluded.html')` if using a template.

# Cache drug names to handle API rate limits
@lru_cache(maxsize=1000)
def get_drug_name(rxcui):
    """Fetch drug name from RxNorm API for a given RXCUI with rate limiting"""
    try:
        # Add rate limiting - sleep for 0.1 seconds between requests
        time.sleep(0.1)
        
        url = f"https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/properties.json"
        response = requests.get(url)
        
        if response.status_code == 429:  # Too Many Requests
            print(f"Rate limit hit for RXCUI {rxcui}, waiting longer...")
            time.sleep(1)  # Wait longer if we hit rate limit
            response = requests.get(url)  # Try again
            
        if response.status_code == 200:
            data = response.json()
            if 'properties' in data:
                return data['properties'].get('name', 'Name not found')
        
        print(f"API Response for {rxcui}:", response.text)
        return 'Name not found'
        
    except Exception as e:
        print(f"Error fetching drug name for RXCUI {rxcui}: {str(e)}")
        return 'Error fetching name'

def process_csv():
    """Process the CSV file"""
    try:
        df = pd.read_csv('excluded_drugs.csv', dtype={'RXCUI': str})
        print(f"Loaded {len(df)} rows from CSV")
        
        yn_columns = ['QUANTITY_LIMIT_YN', 'PRIOR_AUTH_YN', 'STEP_THERAPY_YN', 'CAPPED_BENEFIT_YN']
        for col in yn_columns:
            if col in df.columns:
                df[col] = df[col].map({1: 'Yes', 0: 'No', 'Y': 'Yes', 'N': 'No'})
        
        return df
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return pd.DataFrame()

@app.route('/get_drug_name/<rxcui>')
def get_drug_name_api(rxcui):
    print(f"Fetching drug name for RXCUI: {rxcui}")
    drug_name = get_drug_name(rxcui)
    print(f"Drug name found: {drug_name}")
    return jsonify({'drug_name': drug_name})

@app.route('/')
def index():
    df = process_csv()
    
    display_columns = ['CONTRACT_ID', 'PLAN_ID', 'RXCUI', 'DRUG_NAME', 'TIER', 
                      'QUANTITY_LIMIT_YN', 'QUANTITY_LIMIT_AMOUNT', 'QUANTITY_LIMIT_DAYS', 
                      'PRIOR_AUTH_YN', 'STEP_THERAPY_YN', 'CAPPED_BENEFIT_YN']
    
    df['DRUG_NAME'] = ''
    df = df[display_columns]
    
    data = df.to_dict('records')
    columns = df.columns.tolist()
    
    return render_template('index.html', data=data, columns=columns)

if __name__ == '__main__':
    print("Starting Flask application...")
    app.run(debug=True, host='0.0.0.0', port=5001)

