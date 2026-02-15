# HydroSpark Measurement and Billing System

A comprehensive water utility management system with ML-based forecasting, anomaly detection, and automated billing.

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hydrospark-system
```

2. **Create environment file**
```bash
cp .env.example .env
```

The `.env` file is pre-configured with:
- Database: `root/password`
- Gmail: `conbenlan@gmail.com` with app password
- JWT secret will auto-generate on first run

3. **Start the application**
```bash
docker-compose up --build
```

This will start:
- **MySQL** on port 3307
- **Backend API** on port 5000
- **Frontend** on port 3000

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- API Health: http://localhost:5000/api/health

## Quick Start
Email: customer_958213684@hydrospark.com
Password: welcome123
Customer: Ava Walker

Email: customer_772641217@hydrospark.com
Password: welcome123
Customer: Benjamin White

Email: customer_186640798@hydrospark.com
Password: welcome123
Customer: City of Dallas Public Works

Email: customer_833244776@hydrospark.com
Password: welcome123
Customer: Taylor Davis
### Prerequisites
- Docker & Docker Compose
- Git
- 4GB+ RAM recommended


### Default Admin Credentials
```
Email: admin@hydrospark.com
Password: admin123
```

## 📊 Data Import

To import your 1M+ row dataset:

1. Log in as admin
2. Navigate to Admin > Data Import
3. Upload your CSV/XLSX file with these columns:
   - Customer Name
   - Mailing Address
   - Location ID
   - Customer Type
   - Cycle Number
   - Customer Phone Number (optional)
   - Business Name (optional)
   - Facility Name (optional)
   - Year
   - Month
   - Day
   - Daily Water Usage (CCF)


## 🤖 Machine Learning Models

### Forecasting (Facebook Prophet)
- **Training Data**: Last 2 years of usage
- **Forecast Period**: 12 months ahead
- **Features**: Daily, weekly, and yearly seasonality
- **Output**: Predicted usage + confidence intervals

### Anomaly Detection (Isolation Forest)
- **Algorithm**: Isolation Forest with 10% contamination
- **Threshold**: ML-based dynamic threshold (50%+ deviation)
- **Risk Score**: 0-100 based on deviation magnitude
- **Alert Types**: Spike, Leak, Unusual Pattern


## 🗄️ Database Schema

Key tables:
- **users** - Authentication and roles
- **customers** - Customer profiles
- **water_usage** - Daily usage records (1M+ rows)
- **bills** - Generated bills
- **anomaly_alerts** - Detected anomalies
- **usage_forecasts** - ML predictions
- **meter_readings** - OCR meter photos
- **audit_log** - System audit trail

