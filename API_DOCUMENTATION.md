# AirSense API Documentation

## Overview

The AirSense API provides comprehensive air quality monitoring and prediction services for Bengaluru. It features real-time data collection, machine learning-powered predictions, and detailed analytics.

**Base URL**: `http://localhost:5000/api`

**Version**: 2.0.0

## Authentication

Currently, the API is open and does not require authentication. Rate limiting is applied (100 requests per 15 minutes per IP).

## Endpoints

### Health Check

#### GET /health
Check API health status.

**Response:**
\`\`\`json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
\`\`\`

---

## Air Quality Endpoints

### GET /air-quality/current/:location
Get current air quality data for a location.

**Parameters:**
- `location` (string): Location name (e.g., "bengaluru")

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "location": "bengaluru",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "pm25": 45.2,
    "pm10": 78.5,
    "no2": 32.1,
    "so2": 8.3,
    "co": 1200.5,
    "o3": 65.2,
    "aqi": 95,
    "temperature": 26.5,
    "humidity": 68,
    "pressure": 1013.2,
    "wind_speed": 3.2,
    "wind_direction": 180
  }
}
\`\`\`

### GET /air-quality/history/:location
Get historical air quality data.

**Parameters:**
- `location` (string): Location name
- `hours` (number, optional): Number of hours to retrieve (default: 24)

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "2024-01-15T10:00:00.000Z",
      "location": "bengaluru",
      "pm25": 42.1,
      "pm10": 75.3,
      "aqi": 92
    }
  ],
  "count": 24
}
\`\`\`

### GET /air-quality/trends/:location
Get air quality trend analysis.

**Parameters:**
- `location` (string): Location name
- `period` (string, optional): Grouping period ("hour", "day", "week")

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "period": "2024-01-15",
      "avg_pm25": 43.2,
      "avg_pm10": 76.8,
      "avg_no2": 31.5,
      "avg_aqi": 94,
      "data_points": 24
    }
  ],
  "period": "day"
}
\`\`\`

---

## Weather Endpoints

### GET /weather/current/:location
Get current weather data.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "location": "bengaluru",
    "temperature": 26.5,
    "feels_like": 28.2,
    "humidity": 68,
    "pressure": 1013.2,
    "wind_speed": 3.2,
    "wind_direction": 180,
    "condition": "Clear",
    "description": "clear sky",
    "icon": "01d",
    "visibility": 10000,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
\`\`\`

### GET /weather/forecast/:location
Get weather forecast.

**Parameters:**
- `days` (number, optional): Number of days (default: 5)

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-01-16T00:00:00.000Z",
      "temperature": 24.5,
      "humidity": 72,
      "condition": "Partly Cloudy",
      "wind_speed": 2.8
    }
  ],
  "location": "bengaluru",
  "generated_at": "2024-01-15T10:30:00.000Z"
}
\`\`\`

### GET /weather/health
Check OpenWeather API health.

**Response:**
\`\`\`json
{
  "success": true,
  "api_health": {
    "status": "healthy",
    "response_time": "245ms",
    "rate_limit_remaining": "950"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

---

## Prediction Endpoints

### GET /predictions/:location
Get ML-powered air quality predictions.

**Parameters:**
- `location` (string): Location name
- `hours` (number, optional): Prediction horizon in hours (default: 24)

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-01-15T11:30:00.000Z",
      "horizon": 1,
      "type": "pm25",
      "value": 47.3,
      "confidence": 0.85,
      "uncertainty_lower": 42.1,
      "uncertainty_upper": 52.5,
      "method": "ml-model",
      "model_r2": 0.78
    }
  ],
  "model_info": {
    "models_trained": ["pm25", "pm10", "aqi", "no2", "o3"],
    "version": "2.0.0",
    "last_training": "2024-01-15T09:00:00.000Z"
  },
  "data_points_used": 150
}
\`\`\`

### GET /predictions/confidence/:location
Get prediction confidence analysis.

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "prediction_type": "pm25",
      "avg_confidence": 0.82,
      "min_confidence": 0.65,
      "max_confidence": 0.95,
      "prediction_count": 24,
      "last_prediction": "2024-01-15T10:30:00.000Z"
    }
  ],
  "trends": [
    {
      "hour": "10",
      "prediction_type": "pm25",
      "avg_confidence": 0.85
    }
  ]
}
\`\`\`

### GET /predictions/performance/:location
Get model performance metrics.

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "prediction_type": "pm25",
      "total_predictions": 168,
      "avg_absolute_error": 5.2,
      "avg_confidence": 0.82
    }
  ],
  "hourly_performance": [
    {
      "prediction_horizon": 1,
      "avg_error": 3.8,
      "sample_count": 45
    }
  ],
  "analysis_period": "7 days"
}
\`\`\`

### POST /predictions/retrain/:location
Retrain ML models with latest data.

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Models retrained successfully",
  "model_info": {
    "models_trained": ["pm25", "pm10", "aqi", "no2", "o3"],
    "version": "2.0.0"
  },
  "training_data_points": 200,
  "retrained_at": "2024-01-15T10:30:00.000Z"
}
\`\`\`

---

## Analytics Endpoints

### GET /analytics/summary
Get system analytics summary.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "data_points": {
      "total_measurements": { "count": 1250 },
      "today_measurements": { "count": 48 }
    },
    "air_quality_stats": {
      "avg_aqi": 85.2,
      "min_aqi": 45,
      "max_aqi": 150,
      "avg_pm25": 42.1,
      "avg_pm10": 68.5
    },
    "system_health": {
      "api_uptime": "99.9%",
      "last_data_update": { "last_update": "2024-01-15T10:25:00.000Z" },
      "prediction_accuracy": { "accuracy": 0.82 }
    }
  }
}
\`\`\`

### GET /analytics/performance
Get detailed performance metrics.

**Parameters:**
- `period` (string, optional): Analysis period ("hour", "day", "week")

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "api_performance": {
      "total_requests": { "count": 1250 }
    },
    "data_quality": {
      "completeness": { "percentage": 98.5 }
    },
    "ml_performance": {
      "avg_confidence": { "confidence": 0.82 },
      "predictions_count": { "count": 288 }
    },
    "system_resources": {
      "cpu_usage": 25.3,
      "memory_usage": 42.1,
      "disk_usage": 18.7,
      "database_size": "2.5MB"
    }
  },
  "period": "day"
}
\`\`\`

---

## System Endpoints

### GET /system/status
Get comprehensive system status.

**Response:**
\`\`\`json
{
  "success": true,
  "system": {
    "status": "operational",
    "uptime": 86400,
    "memory_usage": {
      "rss": 45678912,
      "heapTotal": 32456789,
      "heapUsed": 28123456
    },
    "node_version": "v18.17.0"
  },
  "data_collector": {
    "running": true,
    "locations": ["bengaluru"],
    "stats": {
      "total_collections": 144,
      "successful_collections": 142,
      "failed_collections": 2
    }
  },
  "api_health": {
    "status": "healthy"
  },
  "database": {
    "air_quality_records": 1250,
    "weather_records": 1250,
    "prediction_records": 288
  }
}
\`\`\`

---

## Error Responses

All endpoints return errors in the following format:

\`\`\`json
{
  "success": false,
  "error": "Error message description"
}
\`\`\`

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (invalid endpoint)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status code with retry information

---

## Data Models

### Air Quality Data
\`\`\`typescript
interface AirQualityData {
  id: number
  timestamp: string
  location: string
  pm25: number        // PM2.5 in μg/m³
  pm10: number        // PM10 in μg/m³
  no2: number         // NO2 in μg/m³
  so2: number         // SO2 in μg/m³
  co: number          // CO in μg/m³
  o3: number          // O3 in μg/m³
  aqi: number         // Air Quality Index (1-500)
  temperature: number // Temperature in °C
  humidity: number    // Humidity in %
  pressure: number    // Pressure in hPa
  wind_speed: number  // Wind speed in m/s
  wind_direction: number // Wind direction in degrees
  source: string      // Data source
}
\`\`\`

### Prediction Data
\`\`\`typescript
interface PredictionData {
  id: number
  timestamp: string
  location: string
  prediction_type: string    // 'pm25', 'pm10', 'aqi', etc.
  predicted_value: number
  confidence_score: number   // 0-1
  prediction_horizon: number // Hours ahead
  model_version: string
  input_features: string     // JSON string
}
\`\`\`

---

## Usage Examples

### JavaScript/Node.js
\`\`\`javascript
// Get current air quality
const response = await fetch('http://localhost:5000/api/air-quality/current/bengaluru');
const data = await response.json();
console.log('Current AQI:', data.data.aqi);

// Get predictions
const predictions = await fetch('http://localhost:5000/api/predictions/bengaluru?hours=12');
const predData = await predictions.json();
console.log('12-hour predictions:', predData.data);
\`\`\`

### Python
\`\`\`python
import requests

# Get current air quality
response = requests.get('http://localhost:5000/api/air-quality/current/bengaluru')
data = response.json()
print(f"Current AQI: {data['data']['aqi']}")

# Get historical trends
trends = requests.get('http://localhost:5000/api/air-quality/trends/bengaluru')
trend_data = trends.json()
print(f"Trend data points: {len(trend_data['data'])}")
\`\`\`

### cURL
\`\`\`bash
# Get current air quality
curl "http://localhost:5000/api/air-quality/current/bengaluru"

# Get predictions with confidence
curl "http://localhost:5000/api/predictions/bengaluru?hours=24"

# Check system status
curl "http://localhost:5000/api/system/status"
\`\`\`

---

## Support

For API support and questions:
- Check the troubleshooting section in README.md
- Review error messages and status codes
- Ensure OpenWeather API key is properly configured
- Verify database connectivity and permissions
