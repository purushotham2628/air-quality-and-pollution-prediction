const cron = require("node-cron")
const db = require("../database/init")
const { fetchOpenWeatherAirQuality } = require("./openWeatherService")

class DataCollector {
  constructor() {
    this.isRunning = false
    this.locations = ["bengaluru"] // Can be extended to multiple locations
    this.collectionStats = {
      total_collections: 0,
      successful_collections: 0,
      failed_collections: 0,
      last_collection: null,
      last_error: null,
    }
  }

  // Start automated data collection
  start() {
    if (this.isRunning) {
      console.log("⚠️  Data collector is already running")
      return
    }

    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
      console.log("⚠️  OpenWeather API key not configured, data collector will use mock data")
    }

    console.log("🔄 Starting automated data collection...")

    cron.schedule("*/10 * * * *", async () => {
      await this.collectData()
    })

    // Cleanup old data daily at midnight
    cron.schedule("0 0 * * *", async () => {
      await this.cleanupOldData()
    })

    cron.schedule("0 * * * *", async () => {
      await this.generateAnalytics()
    })

    this.isRunning = true
    console.log("✅ Data collector started successfully")

    setTimeout(() => this.collectData(), 5000)
  }

  // Collect data for all locations
  async collectData() {
    try {
      console.log("📊 Collecting air quality data...")
      this.collectionStats.total_collections++

      for (const location of this.locations) {
        try {
          const data = await fetchOpenWeatherAirQuality(location)

          // Store air quality data
          await db.run(
            `
            INSERT INTO air_quality_data 
            (location, pm25, pm10, no2, so2, co, o3, aqi, temperature, humidity, pressure, wind_speed, wind_direction, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              location,
              data.pm25,
              data.pm10,
              data.no2,
              data.so2,
              data.co,
              data.o3,
              data.aqi,
              data.temperature,
              data.humidity,
              data.pressure,
              data.wind_speed,
              data.wind_direction,
              "automated",
            ],
          )

          // Store weather data
          await db.run(
            `
            INSERT INTO weather_data 
            (location, temperature, feels_like, humidity, pressure, wind_speed, wind_direction, weather_condition, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              location,
              data.temperature,
              data.feels_like,
              data.humidity,
              data.pressure,
              data.wind_speed,
              data.wind_direction,
              data.weather_condition,
              data.description,
            ],
          )

          await db.run(
            `
            INSERT INTO analytics (metric_name, metric_value, location, category)
            VALUES (?, ?, ?, ?)
          `,
            ["data_collection_success", 1, location, "system"],
          )

          this.collectionStats.successful_collections++
          console.log(`✅ Data collected for ${location}`)
        } catch (error) {
          console.error(`❌ Error collecting data for ${location}:`, error.message)
          this.collectionStats.failed_collections++
          this.collectionStats.last_error = error.message

          await db.run(
            `
            INSERT INTO analytics (metric_name, metric_value, location, category)
            VALUES (?, ?, ?, ?)
          `,
            ["data_collection_failure", 1, location, "system"],
          )
        }
      }

      this.collectionStats.last_collection = new Date().toISOString()
    } catch (error) {
      console.error("❌ Error in data collection process:", error)
      this.collectionStats.last_error = error.message
    }
  }

  async cleanupOldData() {
    try {
      console.log("🧹 Cleaning up old data...")

      const retentionPolicies = {
        air_quality_data: 30, // 30 days
        weather_data: 30, // 30 days
        predictions: 7, // 7 days
        analytics: 90, // 90 days for analytics
      }

      let totalCleaned = 0

      for (const [table, days] of Object.entries(retentionPolicies)) {
        const result = await db.run(`
          DELETE FROM ${table} 
          WHERE timestamp < datetime('now', '-${days} days')
        `)

        totalCleaned += result.changes
        console.log(`  - ${table}: ${result.changes} records cleaned`)
      }

      await db.run(
        `
        INSERT INTO analytics (metric_name, metric_value, category)
        VALUES (?, ?, ?)
      `,
        ["data_cleanup", totalCleaned, "maintenance"],
      )

      console.log(`✅ Cleanup completed: ${totalCleaned} total records removed`)
    } catch (error) {
      console.error("❌ Error during cleanup:", error)
    }
  }

  async generateAnalytics() {
    try {
      console.log("📈 Generating system analytics...")

      // Calculate data quality metrics
      const dataQuality = await db.get(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(CASE WHEN pm25 IS NOT NULL AND pm10 IS NOT NULL THEN 1 END) as complete_records,
          AVG(aqi) as avg_aqi,
          MAX(timestamp) as latest_data
        FROM air_quality_data 
        WHERE timestamp >= datetime('now', '-24 hours')
      `)

      if (dataQuality.total_records > 0) {
        const completeness = (dataQuality.complete_records / dataQuality.total_records) * 100

        await db.run(
          `
          INSERT INTO analytics (metric_name, metric_value, category)
          VALUES (?, ?, ?)
        `,
          ["data_completeness_percent", completeness, "quality"],
        )

        await db.run(
          `
          INSERT INTO analytics (metric_name, metric_value, category)
          VALUES (?, ?, ?)
        `,
          ["avg_daily_aqi", dataQuality.avg_aqi, "air_quality"],
        )
      }

      // System performance metrics
      await db.run(
        `
        INSERT INTO analytics (metric_name, metric_value, category)
        VALUES (?, ?, ?)
      `,
        [
          "collection_success_rate",
          this.collectionStats.total_collections > 0
            ? (this.collectionStats.successful_collections / this.collectionStats.total_collections) * 100
            : 0,
          "performance",
        ],
      )

      console.log("✅ Analytics generated successfully")
    } catch (error) {
      console.error("❌ Error generating analytics:", error)
    }
  }

  // Stop data collection
  stop() {
    this.isRunning = false
    console.log("⏹️  Data collector stopped")
  }

  // Get collection status
  getStatus() {
    return {
      running: this.isRunning,
      locations: this.locations,
      stats: this.collectionStats,
      uptime: this.isRunning ? Date.now() - new Date(this.collectionStats.last_collection || Date.now()).getTime() : 0,
    }
  }

  addLocation(location) {
    if (!this.locations.includes(location)) {
      this.locations.push(location)
      console.log(`📍 Added location: ${location}`)
      return true
    }
    return false
  }

  removeLocation(location) {
    const index = this.locations.indexOf(location)
    if (index > -1) {
      this.locations.splice(index, 1)
      console.log(`📍 Removed location: ${location}`)
      return true
    }
    return false
  }
}

module.exports = new DataCollector()
