const cors = require('cors')

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean)
    
    // Add Replit domains
    if (origin.includes('replit.dev') || origin.includes('repl.co')) {
      return callback(null, true)
    }
    
    // Add Vercel domains
    if (origin.includes('vercel.app')) {
      return callback(null, true)
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      console.log('CORS blocked origin:', origin)
      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}

module.exports = cors(corsOptions)