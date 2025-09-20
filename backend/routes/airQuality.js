const express = require("express")
const router = express.Router()
const db = require("../database/init")
const { fetchOpenWeatherAirQuality } = require("../services/openWeatherService")

// Get current air quality data
router.get("/current/:location", async (req, res) => {
  try {
    const { location } = req.params

    // Fetch fresh data from OpenWeather API
    const freshData = await fetchOpenWeatherAirQuality(location)

    // Store in database
    await db.run(
      `
      INSERT INTO air_quality_data 
      (location, pm25, pm10, no2, so2, co, o3, aqi, temperature, humidity, pressure, wind_speed, wind_direction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        location,
        freshData.pm25,
        freshData.pm10,
        freshData.no2,
        freshData.so2,
        freshData.co,
        freshData.o3,
        freshData.aqi,
        freshData.temperature,
        freshData.humidity,
        freshData.pressure,
        freshData.wind_speed,
        freshData.wind_direction,
      ],
    )

    res.json({
      success: true,
      data: freshData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching air quality:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch air quality data",
    })
  }
})

// Get historical air quality data
router.get("/history/:location", async (req, res) => {
  try {
    const { location } = req.params
    const { hours = 24 } = req.query

    const data = await db.all(
      `
      SELECT * FROM air_quality_data 
      WHERE location = ? 
      AND timestamp >= datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
    `,
      [location],
    )

    res.json({
      success: true,
      data,
      count: data.length,
    })
  } catch (error) {
    console.error("Error fetching historical data:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch historical data",
    })
  }
})

// Get air quality trends
router.get("/trends/:location", async (req, res) => {
  try {
    const { location } = req.params
    const { period = "day" } = req.query

    let groupBy, timeFormat
    switch (period) {
      case "hour":
        groupBy = "strftime('%Y-%m-%d %H', timestamp)"
        timeFormat = "%Y-%m-%d %H:00:00"
        break
      case "day":
        groupBy = "strftime('%Y-%m-%d', timestamp)"
        timeFormat = "%Y-%m-%d 00:00:00"
        break
      case "week":
        groupBy = "strftime('%Y-%W', timestamp)"
        timeFormat = "%Y-%W"
        break
      default:
        groupBy = "strftime('%Y-%m-%d', timestamp)"
        timeFormat = "%Y-%m-%d 00:00:00"
    }

    const trends = await db.all(
      `
      SELECT 
        ${groupBy} as period,
        AVG(pm25) as avg_pm25,
        AVG(pm10) as avg_pm10,
        AVG(no2) as avg_no2,
        AVG(aqi) as avg_aqi,
        COUNT(*) as data_points
      FROM air_quality_data 
      WHERE location = ? 
      AND timestamp >= datetime('now', '-30 days')
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT 50
    `,
      [location],
    )

    res.json({
      success: true,
      data: trends,
      period,
    })
  } catch (error) {
    console.error("Error fetching trends:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch trend data",
    })
  }
})

module.exports = router
