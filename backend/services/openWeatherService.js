const axios = require("axios")

const API_KEY = process.env.OPENWEATHER_API_KEY
const BASE_URL = "http://api.openweathermap.org/data/2.5"

// Bengaluru coordinates
const BENGALURU_COORDS = {
  lat: 12.9716,
  lon: 77.5946,
}

const LOCATION_COORDS = {
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
}

async function fetchOpenWeatherAirQuality(location = "bengaluru") {
  try {
    if (!API_KEY) {
      throw new Error("OpenWeather API key not configured")
    }

    const coords = LOCATION_COORDS[location.toLowerCase()] || BENGALURU_COORDS

    const maxRetries = 3
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Fetch air pollution data
        const airResponse = await axios.get(`${BASE_URL}/air_pollution`, {
          params: {
            lat: coords.lat,
            lon: coords.lon,
            appid: API_KEY,
          },
          timeout: 10000, // 10 second timeout
        })

        // Fetch weather data
        const weatherResponse = await axios.get(`${BASE_URL}/weather`, {
          params: {
            lat: coords.lat,
            lon: coords.lon,
            appid: API_KEY,
            units: "metric",
          },
          timeout: 10000,
        })

        const airData = airResponse.data.list[0]
        const weatherData = weatherResponse.data

        const processedData = {
          location,
          timestamp: new Date().toISOString(),
          coordinates: coords,

          // Air quality components (μg/m³) with validation
          pm25: validateNumber(airData.components.pm2_5, 0, 500),
          pm10: validateNumber(airData.components.pm10, 0, 1000),
          no2: validateNumber(airData.components.no2, 0, 1000),
          so2: validateNumber(airData.components.so2, 0, 1000),
          co: validateNumber(airData.components.co, 0, 50000),
          o3: validateNumber(airData.components.o3, 0, 1000),
          aqi: validateNumber(airData.main.aqi, 1, 5),

          // Weather data with validation
          temperature: validateNumber(weatherData.main.temp, -50, 60),
          feels_like: validateNumber(weatherData.main.feels_like, -50, 60),
          humidity: validateNumber(weatherData.main.humidity, 0, 100),
          pressure: validateNumber(weatherData.main.pressure, 800, 1200),
          wind_speed: validateNumber(weatherData.wind?.speed || 0, 0, 100),
          wind_direction: validateNumber(weatherData.wind?.deg || 0, 0, 360),
          visibility: validateNumber(weatherData.visibility || 10000, 0, 50000),

          // Weather condition
          weather_condition: weatherData.weather[0].main,
          description: weatherData.weather[0].description,
          weather_icon: weatherData.weather[0].icon,

          // Additional metadata
          api_response_time: Date.now(),
          data_quality: "good",
        }

        console.log(`✅ Successfully fetched data for ${location} (attempt ${attempt})`)
        return processedData
      } catch (error) {
        lastError = error
        console.warn(`⚠️  Attempt ${attempt} failed for ${location}:`, error.message)

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    throw lastError
  } catch (error) {
    console.error("OpenWeather API Error:", error.response?.data || error.message)

    if (error.response?.status === 401) {
      throw new Error("Invalid OpenWeather API key")
    } else if (error.response?.status === 429) {
      throw new Error("API rate limit exceeded")
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error("Network connection failed")
    } else {
      throw new Error("Failed to fetch data from OpenWeather API")
    }
  }
}

function validateNumber(value, min, max) {
  const num = Number.parseFloat(value)
  if (isNaN(num)) return null
  return Math.max(min, Math.min(max, num))
}

async function fetchOpenWeatherForecast(location = "bengaluru", days = 5) {
  try {
    if (!API_KEY) {
      throw new Error("OpenWeather API key not configured")
    }

    const coords = LOCATION_COORDS[location.toLowerCase()] || BENGALURU_COORDS

    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat: coords.lat,
        lon: coords.lon,
        appid: API_KEY,
        units: "metric",
        cnt: days * 8, // 8 forecasts per day (3-hour intervals)
      },
      timeout: 10000,
    })

    const forecasts = response.data.list.map((item) => ({
      timestamp: new Date(item.dt * 1000).toISOString(),
      temperature: validateNumber(item.main.temp, -50, 60),
      feels_like: validateNumber(item.main.feels_like, -50, 60),
      humidity: validateNumber(item.main.humidity, 0, 100),
      pressure: validateNumber(item.main.pressure, 800, 1200),
      wind_speed: validateNumber(item.wind?.speed || 0, 0, 100),
      wind_direction: validateNumber(item.wind?.deg || 0, 0, 360),
      weather_condition: item.weather[0].main,
      description: item.weather[0].description,
      weather_icon: item.weather[0].icon,
      precipitation: validateNumber(item.rain?.["3h"] || 0, 0, 100),
    }))

    return {
      location,
      forecasts,
      generated_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error("OpenWeather Forecast Error:", error.response?.data || error.message)
    throw new Error("Failed to fetch forecast data")
  }
}

async function fetchHistoricalData(location = "bengaluru", days = 7) {
  try {
    // Note: OpenWeather historical data requires a paid plan
    // This is a simulation for demo purposes
    const historicalData = []
    const now = new Date()

    for (let i = days; i >= 1; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)

      // Generate realistic historical data based on seasonal patterns
      const baseTemp = 25 + Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 5
      const basePM25 = 35 + Math.random() * 30

      historicalData.push({
        timestamp: date.toISOString(),
        temperature: baseTemp + (Math.random() - 0.5) * 8,
        humidity: 60 + (Math.random() - 0.5) * 30,
        pm25: basePM25 + (Math.random() - 0.5) * 20,
        pm10: basePM25 * 1.5 + (Math.random() - 0.5) * 25,
        aqi: Math.min(500, Math.max(1, Math.round(basePM25 * 2.5))),
      })
    }

    return {
      location,
      data: historicalData,
      note: "Simulated historical data for demo purposes",
    }
  } catch (error) {
    console.error("Historical data error:", error)
    throw new Error("Failed to fetch historical data")
  }
}

async function checkAPIHealth() {
  try {
    if (!API_KEY) {
      return { status: "error", message: "API key not configured" }
    }

    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat: BENGALURU_COORDS.lat,
        lon: BENGALURU_COORDS.lon,
        appid: API_KEY,
      },
      timeout: 5000,
    })

    return {
      status: "healthy",
      response_time: response.headers["x-response-time"] || "unknown",
      rate_limit_remaining: response.headers["x-ratelimit-remaining"] || "unknown",
    }
  } catch (error) {
    return {
      status: "error",
      message: error.message,
      code: error.response?.status || "unknown",
    }
  }
}

module.exports = {
  fetchOpenWeatherAirQuality,
  fetchOpenWeatherForecast,
  fetchHistoricalData,
  checkAPIHealth,
  LOCATION_COORDS,
}
