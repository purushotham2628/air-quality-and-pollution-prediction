const express = require("express")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const errorHandler = require("./middleware/errorHandler")
const logger = require("./middleware/logger")
const corsMiddleware = require("./middleware/cors")

require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy for Replit environment
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}))
app.use(corsMiddleware)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

app.use(logger)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Import routes
const airQualityRoutes = require("./routes/airQuality")
const weatherRoutes = require("./routes/weather")
const predictionRoutes = require("./routes/predictions")
const analyticsRoutes = require("./routes/analytics")
const systemRoutes = require("./routes/system")

// Use routes
app.use("/api/air-quality", airQualityRoutes)
app.use("/api/weather", weatherRoutes)
app.use("/api/predictions", predictionRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/system", systemRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  })
})

app.use(errorHandler)

// Initialize database and start server
const db = require("./database/init")
const dataCollector = require("./services/dataCollector")

db.initialize()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Air Quality ML Backend running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`)

      if (process.env.OPENWEATHER_API_KEY) {
        dataCollector.start()
        console.log("🔄 Automated data collection started")
      } else {
        console.warn("⚠️  OpenWeather API key not found. Automated collection disabled.")
        console.warn("   Add OPENWEATHER_API_KEY to your .env file to enable data collection.")
      }
    })
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err)
    process.exit(1)
  })

module.exports = app
