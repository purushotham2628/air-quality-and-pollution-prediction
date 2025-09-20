const { SimpleLinearRegression, PolynomialRegression } = require("ml-regression")
const ss = require("simple-statistics")

class MLService {
  constructor() {
    this.models = {
      pm25: null,
      pm10: null,
      aqi: null,
      no2: null,
      o3: null,
    }
    this.modelMetrics = {
      pm25: { accuracy: 0, mse: 0, r2: 0 },
      pm10: { accuracy: 0, mse: 0, r2: 0 },
      aqi: { accuracy: 0, mse: 0, r2: 0 },
      no2: { accuracy: 0, mse: 0, r2: 0 },
      o3: { accuracy: 0, mse: 0, r2: 0 },
    }
    this.lastTraining = null
    this.trainingInterval = 3600000 // 1 hour
    this.minDataPoints = 50 // Minimum data points for training
  }

  prepareFeatures(data) {
    return data.map((record, index) => {
      const timestamp = new Date(record.timestamp)
      const hour = timestamp.getHours()
      const dayOfWeek = timestamp.getDay()
      const month = timestamp.getMonth()

      // Calculate moving averages
      const windowSize = Math.min(5, index + 1)
      const recentData = data.slice(Math.max(0, index - windowSize + 1), index + 1)

      const avgPM25 = recentData.reduce((sum, d) => sum + (d.pm25 || 0), 0) / recentData.length
      const avgPM10 = recentData.reduce((sum, d) => sum + (d.pm10 || 0), 0) / recentData.length
      const avgTemp = recentData.reduce((sum, d) => sum + (d.temperature || 25), 0) / recentData.length

      return {
        // Time-based features
        hour,
        dayOfWeek,
        dayOfMonth: timestamp.getDate(),
        month,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
        isRushHour: (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1 : 0,

        // Weather features
        temperature: record.temperature || 25,
        humidity: record.humidity || 60,
        pressure: record.pressure || 1013,
        wind_speed: record.wind_speed || 5,
        wind_direction: record.wind_direction || 0,

        // Seasonal features
        seasonSin: Math.sin((2 * Math.PI * month) / 12),
        seasonCos: Math.cos((2 * Math.PI * month) / 12),

        // Daily cycle features
        hourSin: Math.sin((2 * Math.PI * hour) / 24),
        hourCos: Math.cos((2 * Math.PI * hour) / 24),

        // Lag features (previous values)
        prev_pm25: index > 0 ? data[index - 1].pm25 : record.pm25,
        prev_pm10: index > 0 ? data[index - 1].pm10 : record.pm10,
        prev_aqi: index > 0 ? data[index - 1].aqi : record.aqi,
        prev_no2: index > 0 ? data[index - 1].no2 : record.no2,
        prev_o3: index > 0 ? data[index - 1].o3 : record.o3,

        // Moving averages
        ma_pm25: avgPM25,
        ma_pm10: avgPM10,
        ma_temp: avgTemp,

        // Weather interaction features
        temp_humidity: ((record.temperature || 25) * (record.humidity || 60)) / 100,
        wind_temp: (record.wind_speed || 5) * (record.temperature || 25),

        // Target values
        pm25: record.pm25,
        pm10: record.pm10,
        aqi: record.aqi,
        no2: record.no2,
        o3: record.o3,
      }
    })
  }

  async trainModels(historicalData) {
    try {
      if (historicalData.length < this.minDataPoints) {
        console.warn(`⚠️  Insufficient data for training: ${historicalData.length} < ${this.minDataPoints}`)
        return false
      }

      console.log(`🧠 Training ML models with ${historicalData.length} data points...`)

      const features = this.prepareFeatures(historicalData)

      // Prepare feature matrix
      const X = features.map((f) => [
        f.hour,
        f.dayOfWeek,
        f.month,
        f.isWeekend,
        f.isRushHour,
        f.temperature,
        f.humidity,
        f.pressure,
        f.wind_speed,
        f.seasonSin,
        f.seasonCos,
        f.hourSin,
        f.hourCos,
        f.prev_pm25,
        f.prev_pm10,
        f.prev_aqi,
        f.ma_pm25,
        f.ma_pm10,
        f.ma_temp,
        f.temp_humidity,
        f.wind_temp,
      ])

      // Train models for each pollutant
      const pollutants = ["pm25", "pm10", "aqi", "no2", "o3"]

      for (const pollutant of pollutants) {
        const y = features.map((f) => f[pollutant]).filter((val) => val != null)
        const validX = X.filter((_, i) => features[i][pollutant] != null)

        if (y.length < this.minDataPoints) {
          console.warn(`⚠️  Insufficient ${pollutant} data: ${y.length}`)
          continue
        }

        // Split data for training and validation
        const splitIndex = Math.floor(validX.length * 0.8)
        const trainX = validX.slice(0, splitIndex)
        const trainY = y.slice(0, splitIndex)
        const testX = validX.slice(splitIndex)
        const testY = y.slice(splitIndex)

        try {
          // Train polynomial regression model
          this.models[pollutant] = new PolynomialRegression(trainX, trainY, 2)

          // Calculate model metrics
          if (testX.length > 0) {
            const predictions = testX.map((x) => this.models[pollutant].predict(x))
            this.modelMetrics[pollutant] = this.calculateMetrics(testY, predictions)

            console.log(
              `✅ ${pollutant.toUpperCase()} model trained - R²: ${this.modelMetrics[pollutant].r2.toFixed(3)}, MSE: ${this.modelMetrics[pollutant].mse.toFixed(2)}`,
            )
          }
        } catch (error) {
          console.error(`❌ Error training ${pollutant} model:`, error.message)
        }
      }

      this.lastTraining = new Date()
      console.log("✅ ML model training completed")

      return true
    } catch (error) {
      console.error("❌ Error in model training:", error)
      return false
    }
  }

  calculateMetrics(actual, predicted) {
    const n = actual.length
    if (n === 0) return { accuracy: 0, mse: 0, r2: 0 }

    // Mean Squared Error
    const mse = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / n

    // R-squared
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / n
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0)
    const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0)
    const r2 = totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : 0

    // Accuracy (percentage of predictions within 20% of actual)
    const accurateCount = actual.filter((val, i) => {
      const error = Math.abs(val - predicted[i]) / Math.max(val, 1)
      return error <= 0.2 // Within 20%
    }).length
    const accuracy = (accurateCount / n) * 100

    return { accuracy, mse, r2 }
  }

  async generatePredictions(historicalData, hours = 24) {
    try {
      // Check if models need retraining
      if (!this.lastTraining || Date.now() - this.lastTraining.getTime() > this.trainingInterval) {
        await this.trainModels(historicalData)
      }

      const predictions = []
      const latestData = historicalData[0]
      const baseTime = new Date()

      // Generate weather forecast features (simplified)
      const weatherForecast = this.generateWeatherForecast(latestData, hours)

      for (let h = 1; h <= hours; h++) {
        const predictionTime = new Date(baseTime.getTime() + h * 60 * 60 * 1000)
        const forecastWeather = weatherForecast[h - 1]

        // Prepare features for prediction
        const features = this.preparePredictionFeatures(predictionTime, latestData, forecastWeather, h)

        // Generate predictions for each pollutant
        const pollutants = ["pm25", "pm10", "aqi", "no2", "o3"]

        for (const pollutant of pollutants) {
          if (!this.models[pollutant]) {
            // Fallback to trend-based prediction
            const value = this.trendBasedPrediction(historicalData, pollutant, h)
            const confidence = Math.max(0.2, 0.6 - h * 0.02)

            predictions.push({
              timestamp: predictionTime.toISOString(),
              horizon: h,
              type: pollutant,
              value: Math.round(value * 10) / 10,
              confidence: Math.round(confidence * 100) / 100,
              method: "trend-based",
              features: features,
            })
          } else {
            try {
              const predicted = this.models[pollutant].predict(features)
              const value = Math.max(0, predicted)

              // Calculate confidence based on model performance and prediction horizon
              const baseConfidence = Math.min(0.95, this.modelMetrics[pollutant].r2 || 0.5)
              const horizonPenalty = Math.max(0.1, 1 - h * 0.03)
              const confidence = baseConfidence * horizonPenalty

              // Add uncertainty bounds
              const uncertainty = this.calculateUncertainty(pollutant, h)

              predictions.push({
                timestamp: predictionTime.toISOString(),
                horizon: h,
                type: pollutant,
                value: Math.round(value * 10) / 10,
                confidence: Math.round(confidence * 100) / 100,
                uncertainty_lower: Math.round((value - uncertainty) * 10) / 10,
                uncertainty_upper: Math.round((value + uncertainty) * 10) / 10,
                method: "ml-model",
                model_r2: this.modelMetrics[pollutant].r2,
                features: features,
              })
            } catch (error) {
              console.error(`Error predicting ${pollutant}:`, error.message)
              // Fallback to trend-based prediction
              const value = this.trendBasedPrediction(historicalData, pollutant, h)
              predictions.push({
                timestamp: predictionTime.toISOString(),
                horizon: h,
                type: pollutant,
                value: Math.round(value * 10) / 10,
                confidence: 0.3,
                method: "fallback",
                features: features,
              })
            }
          }
        }
      }

      return predictions
    } catch (error) {
      console.error("Error generating predictions:", error)
      throw error
    }
  }

  generateWeatherForecast(currentWeather, hours) {
    const forecast = []

    for (let h = 0; h < hours; h++) {
      // Simple weather evolution model
      const tempVariation = Math.sin((h / 24) * 2 * Math.PI) * 5 // Daily temperature cycle
      const humidityVariation = (Math.random() - 0.5) * 10
      const windVariation = (Math.random() - 0.5) * 2

      forecast.push({
        temperature: (currentWeather.temperature || 25) + tempVariation + (Math.random() - 0.5) * 2,
        humidity: Math.max(20, Math.min(90, (currentWeather.humidity || 60) + humidityVariation)),
        pressure: (currentWeather.pressure || 1013) + (Math.random() - 0.5) * 5,
        wind_speed: Math.max(0, (currentWeather.wind_speed || 5) + windVariation),
        wind_direction: (currentWeather.wind_direction || 0) + (Math.random() - 0.5) * 30,
      })
    }

    return forecast
  }

  preparePredictionFeatures(predictionTime, latestData, forecastWeather, horizon) {
    const hour = predictionTime.getHours()
    const dayOfWeek = predictionTime.getDay()
    const month = predictionTime.getMonth()

    return [
      hour,
      dayOfWeek,
      month,
      dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0, // isWeekend
      (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1 : 0, // isRushHour
      forecastWeather.temperature,
      forecastWeather.humidity,
      forecastWeather.pressure,
      forecastWeather.wind_speed,
      Math.sin((2 * Math.PI * month) / 12), // seasonSin
      Math.cos((2 * Math.PI * month) / 12), // seasonCos
      Math.sin((2 * Math.PI * hour) / 24), // hourSin
      Math.cos((2 * Math.PI * hour) / 24), // hourCos
      latestData.pm25 || 35, // prev_pm25
      latestData.pm10 || 50, // prev_pm10
      latestData.aqi || 75, // prev_aqi
      latestData.pm25 || 35, // ma_pm25 (simplified)
      latestData.pm10 || 50, // ma_pm10 (simplified)
      forecastWeather.temperature, // ma_temp (simplified)
      (forecastWeather.temperature * forecastWeather.humidity) / 100, // temp_humidity
      forecastWeather.wind_speed * forecastWeather.temperature, // wind_temp
    ]
  }

  calculateUncertainty(pollutant, horizon) {
    const baseUncertainty = Math.sqrt(this.modelMetrics[pollutant].mse || 100)
    const horizonMultiplier = 1 + horizon * 0.1 // Uncertainty increases with time
    return baseUncertainty * horizonMultiplier
  }

  // Enhanced trend-based prediction fallback
  trendBasedPrediction(data, metric, hours) {
    const values = data
      .slice(0, Math.min(48, data.length))
      .map((d) => d[metric])
      .filter((v) => v != null)

    if (values.length < 3) {
      // Default values based on typical Bengaluru air quality
      const defaults = { pm25: 35, pm10: 55, aqi: 85, no2: 25, o3: 60 }
      return defaults[metric] || 50
    }

    // Calculate multiple trend components
    const recentTrend = this.calculateTrend(values.slice(0, 12)) // Last 12 hours
    const dailyTrend = this.calculateTrend(values.slice(0, 24)) // Last 24 hours
    const weeklyTrend = this.calculateTrend(values) // All available data

    // Weighted combination of trends
    const combinedTrend = recentTrend * 0.5 + dailyTrend * 0.3 + weeklyTrend * 0.2

    // Apply seasonal and daily patterns
    const hour = (new Date().getHours() + hours) % 24
    const seasonalFactor = this.getSeasonalFactor(metric, new Date().getMonth())
    const dailyFactor = this.getDailyFactor(metric, hour)

    const predicted = values[0] + combinedTrend * hours * seasonalFactor * dailyFactor

    // Ensure reasonable bounds
    const bounds = { pm25: [0, 300], pm10: [0, 500], aqi: [1, 500], no2: [0, 200], o3: [0, 300] }
    const [min, max] = bounds[metric] || [0, 1000]

    return Math.max(min, Math.min(max, predicted))
  }

  calculateTrend(values) {
    if (values.length < 2) return 0

    const x = values.map((_, i) => i)
    const regression = ss.linearRegression(x.map((xi, i) => [xi, values[i]]))
    return regression.m || 0
  }

  getSeasonalFactor(metric, month) {
    // Bengaluru seasonal patterns (simplified)
    const seasonalPatterns = {
      pm25: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.4], // Higher in winter
      pm10: [1.3, 1.2, 1.1, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3],
      aqi: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3],
      no2: [1.1, 1.0, 0.9, 0.9, 0.8, 0.8, 0.9, 1.0, 1.0, 1.1, 1.1, 1.2],
      o3: [0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9, 0.9, 0.9], // Higher in summer
    }

    return seasonalPatterns[metric]?.[month] || 1.0
  }

  getDailyFactor(metric, hour) {
    // Daily pollution patterns (rush hours have higher pollution)
    const rushHourFactor = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.3 : 1.0
    const nightFactor = hour >= 22 || hour <= 5 ? 0.8 : 1.0

    return rushHourFactor * nightFactor
  }

  // Calculate AQI from PM values (enhanced)
  calculateAQI(pm25, pm10) {
    // US EPA AQI calculation for PM2.5
    const pm25Breakpoints = [
      [0, 12.0, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 350.4, 301, 400],
      [350.5, 500.4, 401, 500],
    ]

    for (const [cLow, cHigh, iLow, iHigh] of pm25Breakpoints) {
      if (pm25 >= cLow && pm25 <= cHigh) {
        return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow)
      }
    }

    return pm25 > 500.4 ? 500 : 50 // Default fallback
  }

  getModelInfo() {
    return {
      models_trained: Object.keys(this.models).filter((k) => this.models[k] !== null),
      model_metrics: this.modelMetrics,
      last_training: this.lastTraining,
      training_interval: this.trainingInterval,
      min_data_points: this.minDataPoints,
      version: "2.0.0",
      features_count: 21,
      algorithms: ["Polynomial Regression", "Trend Analysis", "Seasonal Decomposition"],
    }
  }

  async evaluateModels(testData) {
    if (!testData || testData.length === 0) return null

    const evaluation = {}
    const features = this.prepareFeatures(testData)

    for (const [pollutant, model] of Object.entries(this.models)) {
      if (!model) continue

      const actual = features.map((f) => f[pollutant]).filter((v) => v != null)
      const X = features
        .filter((_, i) => features[i][pollutant] != null)
        .map((f) => [
          f.hour,
          f.dayOfWeek,
          f.month,
          f.isWeekend,
          f.isRushHour,
          f.temperature,
          f.humidity,
          f.pressure,
          f.wind_speed,
          f.seasonSin,
          f.seasonCos,
          f.hourSin,
          f.hourCos,
          f.prev_pm25,
          f.prev_pm10,
          f.prev_aqi,
          f.ma_pm25,
          f.ma_pm10,
          f.ma_temp,
          f.temp_humidity,
          f.wind_temp,
        ])

      if (actual.length === 0) continue

      try {
        const predicted = X.map((x) => model.predict(x))
        evaluation[pollutant] = this.calculateMetrics(actual, predicted)
      } catch (error) {
        console.error(`Error evaluating ${pollutant} model:`, error.message)
        evaluation[pollutant] = { accuracy: 0, mse: Number.POSITIVE_INFINITY, r2: 0 }
      }
    }

    return evaluation
  }
}

module.exports = new MLService()
