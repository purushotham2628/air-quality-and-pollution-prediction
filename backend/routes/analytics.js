const express = require("express")
const router = express.Router()
const db = require("../database/init")

// Get system analytics summary
router.get("/summary", async (req, res) => {
  try {
    const summary = {
      data_points: {},
      air_quality_stats: {},
      system_health: {},
      recent_activity: {},
    }

    // Data points count
    summary.data_points.total_measurements = await db.get(`
      SELECT COUNT(*) as count FROM air_quality_data
    `)

    summary.data_points.today_measurements = await db.get(`
      SELECT COUNT(*) as count FROM air_quality_data 
      WHERE date(timestamp) = date('now')
    `)

    // Air quality statistics
    const aqStats = await db.get(`
      SELECT 
        AVG(aqi) as avg_aqi,
        MIN(aqi) as min_aqi,
        MAX(aqi) as max_aqi,
        AVG(pm25) as avg_pm25,
        AVG(pm10) as avg_pm10
      FROM air_quality_data 
      WHERE timestamp >= datetime('now', '-24 hours')
    `)
    summary.air_quality_stats = aqStats

    // System health metrics
    summary.system_health.api_uptime = "99.9%"
    summary.system_health.last_data_update = await db.get(`
      SELECT MAX(timestamp) as last_update FROM air_quality_data
    `)

    summary.system_health.prediction_accuracy = await db.get(`
      SELECT AVG(confidence_score) as accuracy FROM predictions 
      WHERE timestamp >= datetime('now', '-24 hours')
    `)

    // Recent activity
    summary.recent_activity.predictions_generated = await db.get(`
      SELECT COUNT(*) as count FROM predictions 
      WHERE timestamp >= datetime('now', '-1 hour')
    `)

    res.json({
      success: true,
      data: summary,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating analytics summary:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate analytics summary",
    })
  }
})

// Get performance metrics
router.get("/performance", async (req, res) => {
  try {
    const { period = "day" } = req.query

    let timeFilter
    switch (period) {
      case "hour":
        timeFilter = "datetime('now', '-1 hour')"
        break
      case "day":
        timeFilter = "datetime('now', '-1 day')"
        break
      case "week":
        timeFilter = "datetime('now', '-7 days')"
        break
      default:
        timeFilter = "datetime('now', '-1 day')"
    }

    const metrics = {
      api_performance: {},
      data_quality: {},
      ml_performance: {},
      system_resources: {},
    }

    // API Performance
    metrics.api_performance.total_requests = await db.get(`
      SELECT COUNT(*) as count FROM analytics 
      WHERE metric_name = 'api_request' 
      AND timestamp >= ${timeFilter}
    `)

    // Data Quality
    metrics.data_quality.completeness = await db.get(`
      SELECT 
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM air_quality_data WHERE timestamp >= ${timeFilter})) as percentage
      FROM air_quality_data 
      WHERE timestamp >= ${timeFilter}
      AND pm25 IS NOT NULL 
      AND pm10 IS NOT NULL 
      AND aqi IS NOT NULL
    `)

    // ML Performance
    metrics.ml_performance.avg_confidence = await db.get(`
      SELECT AVG(confidence_score) as confidence FROM predictions 
      WHERE timestamp >= ${timeFilter}
    `)

    metrics.ml_performance.predictions_count = await db.get(`
      SELECT COUNT(*) as count FROM predictions 
      WHERE timestamp >= ${timeFilter}
    `)

    // System Resources (simulated)
    metrics.system_resources = {
      cpu_usage: Math.random() * 30 + 10, // 10-40%
      memory_usage: Math.random() * 20 + 30, // 30-50%
      disk_usage: Math.random() * 10 + 15, // 15-25%
      database_size: "2.5MB",
    }

    res.json({
      success: true,
      data: metrics,
      period,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating performance metrics:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate performance metrics",
    })
  }
})

// Log analytics event
router.post("/log", async (req, res) => {
  try {
    const { metric_name, metric_value, location, category } = req.body

    await db.run(
      `
      INSERT INTO analytics (metric_name, metric_value, location, category)
      VALUES (?, ?, ?, ?)
    `,
      [metric_name, metric_value, location, category],
    )

    res.json({
      success: true,
      message: "Analytics event logged successfully",
    })
  } catch (error) {
    console.error("Error logging analytics:", error)
    res.status(500).json({
      success: false,
      error: "Failed to log analytics event",
    })
  }
})

module.exports = router
