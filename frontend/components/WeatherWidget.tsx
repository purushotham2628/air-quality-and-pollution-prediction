"use client"

import { motion } from "framer-motion"
import { Thermometer, Droplets, Wind, Gauge, Sun, Cloud, CloudRain, CloudSnow } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface WeatherData {
  temperature: number
  humidity: number
  pressure: number
  wind_speed: number
  wind_direction: number
  weather_condition: string
  description: string
}

interface WeatherWidgetProps {
  data: WeatherData | null
}

export default function WeatherWidget({ data }: WeatherWidgetProps) {
  const getWeatherIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "clear":
        return <Sun className="h-6 w-6 text-yellow-500" />
      case "clouds":
        return <Cloud className="h-6 w-6 text-gray-400" />
      case "rain":
        return <CloudRain className="h-6 w-6 text-blue-500" />
      case "snow":
        return <CloudSnow className="h-6 w-6 text-blue-200" />
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />
    }
  }

  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  if (!data) {
    return (
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Weather data unavailable</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <Card className="glass border-0 bg-gradient-to-r from-card/80 to-card/40">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* Temperature */}
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Thermometer className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{data.temperature?.toFixed(1)}°C</div>
                <div className="text-xs text-muted-foreground">Temperature</div>
              </div>
            </motion.div>

            {/* Humidity */}
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{data.humidity}%</div>
                <div className="text-xs text-muted-foreground">Humidity</div>
              </div>
            </motion.div>

            {/* Wind */}
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Wind className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{data.wind_speed?.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">m/s {getWindDirection(data.wind_direction)}</div>
              </div>
            </motion.div>

            {/* Pressure */}
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Gauge className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{data.pressure?.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">hPa</div>
              </div>
            </motion.div>

            {/* Weather Condition */}
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">{getWeatherIcon(data.weather_condition)}</div>
              <div>
                <div className="text-sm font-semibold capitalize">{data.weather_condition}</div>
                <div className="text-xs text-muted-foreground capitalize">{data.description}</div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
