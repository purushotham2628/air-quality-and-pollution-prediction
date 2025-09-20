const express = require("express")
const router = express.Router()
const db = require("../database/init")
const MLService = require("../services/mlService")

// Get air quality predictions
router.get("/:location", async (req, res) => {
  try {
    const { location } = req.params
    const { hours = 24 } = req.query

    // Get historical data for ML model
    const historicalData = await db.all(
      `
      SELECT * FROM air_quality_data 
      WHERE location = ? 
      ORDER BY timestamp DESC 
      LIMIT 200
    `,
      [location],
    )

    if (historicalData.length < 10) {
      return res.status(400).json({
        success: false,
        error: "Insufficient historical data for predictions",
        required: 10,
        available: historicalData.length,
      })
    }

    // Generate predictions using ML service
    const predictions = await MLService.generatePredictions(historicalData, Number.parseInt(hours))

    // Store predictions in database
    for (const prediction of predictions) {
      await db.run(
        `
        INSERT INTO predictions 
        (location, prediction_type, predicted_value, confidence_score, prediction_horizon, model_version, input_features)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          location,
          prediction.type,
          prediction.value,
          prediction.confidence,
          prediction.horizon,
          "v2.0",
          JSON.stringify(prediction.features),
        ],
      )
    }

    res.json({
      success: true,
      data: predictions,
      model_info: MLService.getModelInfo(),
      data_points_used: historicalData.length,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating predictions:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate predictions",
    })
  }
})

router.get("/evaluate/:location", async (req, res) => {
  try {
    const { location } = req.params

    // Get recent data for evaluation
    const testData = await db.all(
      `
      SELECT * FROM air_quality_data 
      WHERE location = ? 
      AND timestamp >= datetime('now', '-7 days')
      ORDER BY timestamp DESC 
      LIMIT 100
    `,
      [location],
    )

    if (testData.length < 20) {
      return res.status(400).json({
        success: false,
        error: "Insufficient data for model evaluation",
      })
    }

    const evaluation = await MLService.evaluateModels(testData)

    res.json({
      success: true,
      evaluation,
      test_data_points: testData.length,
      evaluated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error evaluating models:", error)
    res.status(500).json({
      success: false,
      error: "Failed to evaluate models",
    })
  }
})

// Get prediction confidence scores
router.get("/confidence/:location", async (req, res) => {
  try {
    const { location } = req.params

    const confidenceData = await db.all(
      `
      SELECT 
        prediction_type,
        AVG(confidence_score) as avg_confidence,
        MIN(confidence_score) as min_confidence,
        MAX(confidence_score) as max_confidence,
        COUNT(*) as prediction_count,
        MAX(timestamp) as last_prediction
      FROM predictions 
      WHERE location = ? 
      AND timestamp >= datetime('now', '-24 hours')
      GROUP BY prediction_type
      ORDER BY avg_confidence DESC
    `,
      [location],
    )

    const confidenceTrends = await db.all(
      `
      SELECT 
        strftime('%H', timestamp) as hour,
        prediction_type,
        AVG(confidence_score) as avg_confidence
      FROM predictions 
      WHERE location = ? 
      AND timestamp >= datetime('now', '-7 days')
      GROUP BY strftime('%H', timestamp), prediction_type
      ORDER BY hour, prediction_type
    `,
      [location],
    )

    res.json({
      success: true,
      data: confidenceData,
      trends: confidenceTrends,
      model_info: MLService.getModelInfo(),
    })
  } catch (error) {
    console.error("Error fetching confidence data:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch confidence data",
    })
  }
})

// Get model performance metrics
router.get("/performance/:location", async (req, res) => {
  try {
    const { location } = req.params

    // Calculate model accuracy by comparing predictions with actual values
    const performance = await db.all(
      `
      SELECT 
        p.prediction_type,
        COUNT(*) as total_predictions,
        AVG(ABS(p.predicted_value - CASE 
          WHEN p.prediction_type = 'pm25' THEN a.pm25
          WHEN p.prediction_type = 'pm10' THEN a.pm10
          WHEN p.prediction_type = 'aqi' THEN a.aqi
          WHEN p.prediction_type = 'no2' THEN a.no2
          WHEN p.prediction_type = 'o3' THEN a.o3
          ELSE a.pm25
        END)) as avg_absolute_error,
        AVG(p.confidence_score) as avg_confidence,
        MIN(p.confidence_score) as min_confidence,
        MAX(p.confidence_score) as max_confidence
      FROM predictions p
      JOIN air_quality_data a ON 
        p.location = a.location 
        AND datetime(p.timestamp, '+' || p.prediction_horizon || ' hours') BETWEEN 
            datetime(a.timestamp, '-30 minutes') AND datetime(a.timestamp, '+30 minutes')
      WHERE p.location = ?
      AND p.timestamp >= datetime('now', '-7 days')
      GROUP BY p.prediction_type
    `,
      [location],
    )

    const hourlyPerformance = await db.all(
      `
      SELECT 
        p.prediction_horizon,
        AVG(ABS(p.predicted_value - CASE 
          WHEN p.prediction_type = 'pm25' THEN a.pm25
          WHEN p.prediction_type = 'pm10' THEN a.pm10
          WHEN p.prediction_type = 'aqi' THEN a.aqi
          ELSE a.pm25
        END)) as avg_error,
        COUNT(*) as sample_count
      FROM predictions p
      JOIN air_quality_data a ON 
        p.location = a.location 
        AND datetime(p.timestamp, '+' || p.prediction_horizon || ' hours') BETWEEN 
            datetime(a.timestamp, '-30 minutes') AND datetime(a.timestamp, '+30 minutes')
      WHERE p.location = ?
      AND p.timestamp >= datetime('now', '-7 days')
      AND p.prediction_type = 'pm25'
      GROUP BY p.prediction_horizon
      ORDER BY p.prediction_horizon
    `,
      [location],
    )

    res.json({
      success: true,
      data: performance,
      hourly_performance: hourlyPerformance,
      model_info: MLService.getModelInfo(),
      analysis_period: "7 days",
    })
  } catch (error) {
    console.error("Error calculating performance:", error)
    res.status(500).json({
      success: false,
      error: "Failed to calculate model performance",
    })
  }
})

router.post("/retrain/:location", async (req, res) => {
  try {
    const { location } = req.params

    // Get fresh training data
    const trainingData = await db.all(
      `
      SELECT * FROM air_quality_data 
      WHERE location = ? 
      ORDER BY timestamp DESC 
      LIMIT 500
    `,
      [location],
    )

    if (trainingData.length < 50) {
      return res.status(400).json({
        success: false,
        error: "Insufficient data for model retraining",
        required: 50,
        available: trainingData.length,
      })
    }

    // Retrain models
    const success = await MLService.trainModels(trainingData)

    if (success) {
      res.json({
        success: true,
        message: "Models retrained successfully",
        model_info: MLService.getModelInfo(),
        training_data_points: trainingData.length,
        retrained_at: new Date().toISOString(),
      })
    } else {
      res.status(500).json({
        success: false,
        error: "Model retraining failed",
      })
    }
  } catch (error) {
    console.error("Error retraining models:", error)
    res.status(500).json({
      success: false,
      error: "Failed to retrain models",
    })
  }
})

router.get("/accuracy/:location", async (req, res) => {
  try {
    const { location } = req.params
    const { days = 7 } = req.query

    // Calculate prediction accuracy over time
    const accuracyData = await db.all(
      `
      SELECT 
        date(p.timestamp) as prediction_date,
        p.prediction_type,
        COUNT(*) as total_predictions,
        AVG(CASE 
          WHEN ABS(p.predicted_value - CASE 
            WHEN p.prediction_type = 'pm25' THEN a.pm25
            WHEN p.prediction_type = 'pm10' THEN a.pm10
            WHEN p.prediction_type = 'aqi' THEN a.aqi
            WHEN p.prediction_type = 'no2' THEN a.no2
            WHEN p.prediction_type = 'o3' THEN a.o3
            ELSE a.pm25
          END) / CASE 
            WHEN p.prediction_type = 'pm25' THEN a.pm25
            WHEN p.prediction_type = 'pm10' THEN a.pm10
            WHEN p.prediction_type = 'aqi' THEN a.aqi
            WHEN p.prediction_type = 'no2' THEN a.no2
            WHEN p.prediction_type = 'o3' THEN a.o3
            ELSE a.pm25
          END <= 0.2 THEN 1 ELSE 0 
        END) * 100 as accuracy_percentage
      FROM predictions p
      JOIN air_quality_data a ON 
        p.location = a.location 
        AND datetime(p.timestamp, '+' || p.prediction_horizon || ' hours') BETWEEN 
            datetime(a.timestamp, '-30 minutes') AND datetime(a.timestamp, '+30 minutes')
      WHERE p.location = ?
      AND p.timestamp >= datetime('now', '-${days} days')
      GROUP BY date(p.timestamp), p.prediction_type
      ORDER BY prediction_date DESC, p.prediction_type
    `,
      [location],
    )

    res.json({
      success: true,
      data: accuracyData,
      period: `${days} days`,
      note: "Accuracy is percentage of predictions within 20% of actual values",
    })
  } catch (error) {
    console.error("Error calculating accuracy:", error)
    res.status(500).json({
      success: false,
      error: "Failed to calculate prediction accuracy",
    })
  }
})

module.exports = router
