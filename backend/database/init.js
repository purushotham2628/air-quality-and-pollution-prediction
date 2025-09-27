const sqlite3 = require("sqlite3").verbose()
const path = require("path")
const fs = require("fs")

const DB_PATH = path.join(__dirname, "air_quality.db")

class Database {
  constructor() {
    this.db = null
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      // Ensure database directory exists
      const dbDir = path.dirname(DB_PATH)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }
      
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error("Error opening database:", err)
          reject(err)
        } else {
          console.log("📁 Connected to SQLite database")
          this.createTables().then(resolve).catch(reject)
        }
      })
    })
  }

  async createTables() {
    const tables = [
      // Air quality measurements table
      `CREATE TABLE IF NOT EXISTS air_quality_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        location TEXT NOT NULL,
        pm25 REAL,
        pm10 REAL,
        no2 REAL,
        so2 REAL,
        co REAL,
        o3 REAL,
        aqi INTEGER,
        temperature REAL,
        humidity REAL,
        pressure REAL,
        wind_speed REAL,
        wind_direction REAL,
        source TEXT DEFAULT 'api'
      )`,

      // Weather data table
      `CREATE TABLE IF NOT EXISTS weather_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        location TEXT NOT NULL,
        temperature REAL,
        feels_like REAL,
        humidity INTEGER,
        pressure REAL,
        visibility REAL,
        uv_index REAL,
        wind_speed REAL,
        wind_direction REAL,
        weather_condition TEXT,
        description TEXT
      )`,

      // ML predictions table
      `CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        location TEXT NOT NULL,
        prediction_type TEXT NOT NULL,
        predicted_value REAL,
        confidence_score REAL,
        prediction_horizon INTEGER,
        model_version TEXT,
        input_features TEXT
      )`,

      // System analytics table
      `CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metric_name TEXT NOT NULL,
        metric_value REAL,
        location TEXT,
        category TEXT
      )`,
    ]

    try {
      for (const table of tables) {
        await this.run(table)
      }
      console.log("✅ Database tables created successfully")
    } catch (error) {
      console.error("❌ Error creating tables:", error)
      throw error
    }
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      this.db.run(sql, params, function (err) {
        if (err) reject(err)
        else resolve({ id: this.lastID, changes: this.changes })
      })
    })
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  close() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }
      this.db.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

module.exports = new Database()
