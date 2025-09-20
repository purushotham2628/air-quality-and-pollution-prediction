const express = require("express")
const router = express.Router()
const dataCollector = require("../services/dataCollector")
const { checkAPIHealth } = require("../services/openWeatherService")
const db = require("../database/init")

router.get("/status", async (req, res) => {
  try {
    const collectorStatus = dataCollector.getStatus()
    const apiHealth = await checkAPIHealth()

    // Get database stats
    const dbStats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM air_quality_data) as air_quality_records,
        (SELECT COUNT(*) FROM weather_data) as weather_records,
        (SELECT COUNT(*) FROM predictions) as prediction_records,
        (SELECT MAX(timestamp) FROM air_quality_data) as latest_data
    `)

    res.json({
      success: true,
      system: {
        status: "operational",
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version,
      },
      data_collector: collectorStatus,
      api_health: apiHealth,
      database: dbStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting system status:", error)
    res.status(500).json({
      success: false,
      error: "Failed to get system status",
    })
  }
})

router.post("/collector/start", (req, res) => {
  try {
    dataCollector.start()
    res.json({
      success: true,
      message: "Data collector started",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to start data collector",
    })
  }
})

router.post("/collector/stop", (req, res) => {
  try {
    dataCollector.stop()
    res.json({
      success: true,
      message: "Data collector stopped",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to stop data collector",
    })
  }
})

router.post("/locations", (req, res) => {
  try {
    const { location } = req.body
    if (!location) {
      return res.status(400).json({
        success: false,
        error: "Location is required",
      })
    }

    const added = dataCollector.addLocation(location)
    res.json({
      success: true,
      message: added ? "Location added" : "Location already exists",
      locations: dataCollector.getStatus().locations,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to add location",
    })
  }
})

router.delete("/locations/:location", (req, res) => {
  try {
    const { location } = req.params
    const removed = dataCollector.removeLocation(location)

    res.json({
      success: true,
      message: removed ? "Location removed" : "Location not found",
      locations: dataCollector.getStatus().locations,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to remove location",
    })
  }
})

module.exports = router
