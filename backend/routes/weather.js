const express = require("express")
const router = express.Router()
const db = require("../database/init")
const {
  fetchOpenWeatherAirQuality,
  fetchOpenWeatherForecast,
  checkAPIHealth,
} = require("../services/openWeatherService")

// Get current weather data
router.get("/current/:location", async (req, res) => {
  try {
    const { location } = req.params

    // Fetch fresh weather data
    const weatherData = await fetchOpenWeatherAirQuality(location)

    // Store weather data in database
    await db.run(
      `
      INSERT INTO weather_data 
      (location, temperature, feels_like, humidity, pressure, wind_speed, wind_direction, weather_condition, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        location,
        weatherData.temperature,
        weatherData.feels_like,
        weatherData.humidity,
        weatherData.pressure,
        weatherData.wind_speed,
        weatherData.wind_direction,
        weatherData.weather_condition,
        weatherData.description,
      ],
    )

    res.json({
      success: true,
      data: {
        location: weatherData.location,
        temperature: weatherData.temperature,
        feels_like: weatherData.feels_like,
        humidity: weatherData.humidity,
        pressure: weatherData.pressure,
        wind_speed: weatherData.wind_speed,
        wind_direction: weatherData.wind_direction,
        condition: weatherData.weather_condition,
        description: weatherData.description,
        icon: weatherData.weather_icon,
        visibility: weatherData.visibility,
        timestamp: weatherData.timestamp,
      },
    })
  } catch (error) {
    console.error("Error fetching weather:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch weather data",
    })
  }
})

router.get("/forecast/:location", async (req, res) => {
  try {
    const { location } = req.params
    const { days = 5 } = req.query

    const forecastData = await fetchOpenWeatherForecast(location, Number.parseInt(days))

    res.json({
      success: true,
      data: forecastData.forecasts,
      location: forecastData.location,
      generated_at: forecastData.generated_at,
    })
  } catch (error) {
    console.error("Error fetching forecast:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch weather forecast",
    })
  }
})

router.get("/health", async (req, res) => {
  try {
    const health = await checkAPIHealth()

    res.json({
      success: true,
      api_health: health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to check API health",
    })
  }
})

router.get("/history/:location", async (req, res) => {
  try {
    const { location } = req.params
    const { days = 7 } = req.query

    const historicalData = await db.all(
      `
      SELECT * FROM weather_data 
      WHERE location = ? 
      AND timestamp >= datetime('now', '-${days} days')
      ORDER BY timestamp DESC
    `,
      [location],
    )

    res.json({
      success: true,
      data: historicalData,
      count: historicalData.length,
      period: `${days} days`,
    })
  } catch (error) {
    console.error("Error fetching weather history:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch weather history",
    })
  }
})

module.exports = router
