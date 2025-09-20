"use client"

import { motion } from "framer-motion"
import { Activity, AlertTriangle, CheckCircle, TrendingUp, Minus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AirQualityData {
  pm25: number
  pm10: number
  no2: number
  so2: number
  co: number
  o3: number
  aqi: number
}

interface MetricsGridProps {
  data: AirQualityData | null
}

export default function MetricsGrid({ data }: MetricsGridProps) {
  const getHealthImpact = (pollutant: string, value: number) => {
    const thresholds = {
      pm25: { good: 12, moderate: 35.4, unhealthy: 55.4 },
      pm10: { good: 54, moderate: 154, unhealthy: 254 },
      no2: { good: 53, moderate: 100, unhealthy: 360 },
      so2: { good: 35, moderate: 75, unhealthy: 185 },
      co: { good: 4400, moderate: 9400, unhealthy: 12400 },
      o3: { good: 54, moderate: 70, unhealthy: 85 },
    }

    const threshold = thresholds[pollutant as keyof typeof thresholds]
    if (!threshold) return { level: "unknown", icon: Minus, color: "text-gray-400" }

    if (value <= threshold.good) {
      return { level: "good", icon: CheckCircle, color: "text-green-500" }
    } else if (value <= threshold.moderate) {
      return { level: "moderate", icon: TrendingUp, color: "text-yellow-500" }
    } else if (value <= threshold.unhealthy) {
      return { level: "unhealthy", icon: AlertTriangle, color: "text-orange-500" }
    } else {
      return { level: "hazardous", icon: AlertTriangle, color: "text-red-500" }
    }
  }

  const pollutants = [
    { key: "pm25", name: "PM2.5", unit: "μg/m³", description: "Fine particles" },
    { key: "pm10", name: "PM10", unit: "μg/m³", description: "Coarse particles" },
    { key: "no2", name: "NO₂", unit: "μg/m³", description: "Nitrogen dioxide" },
    { key: "so2", name: "SO₂", unit: "μg/m³", description: "Sulfur dioxide" },
    { key: "co", name: "CO", unit: "μg/m³", description: "Carbon monoxide" },
    { key: "o3", name: "O₃", unit: "μg/m³", description: "Ground-level ozone" },
  ]

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pollutant Breakdown</CardTitle>
          <CardDescription>Detailed air quality metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">No data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Pollutant Breakdown</span>
        </CardTitle>
        <CardDescription>Individual pollutant levels and health impacts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pollutants.map((pollutant, index) => {
            const value = data[pollutant.key as keyof AirQualityData]
            const health = getHealthImpact(pollutant.key, value)
            const IconComponent = health.icon

            return (
              <motion.div
                key={pollutant.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`h-4 w-4 ${health.color}`} />
                  <div>
                    <div className="font-medium text-sm">{pollutant.name}</div>
                    <div className="text-xs text-muted-foreground">{pollutant.description}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">
                    {value?.toFixed(1)} {pollutant.unit}
                  </div>
                  <Badge variant="outline" className={`text-xs ${health.color} border-current`}>
                    {health.level}
                  </Badge>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Health Recommendations */}
        <div className="mt-6 p-4 bg-card border border-border rounded-lg">
          <h4 className="font-medium text-sm mb-2">Health Recommendations</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            {data.aqi <= 50 && <p>✅ Air quality is good. Enjoy outdoor activities!</p>}
            {data.aqi > 50 && data.aqi <= 100 && (
              <p>⚠️ Moderate air quality. Sensitive individuals should limit outdoor exposure.</p>
            )}
            {data.aqi > 100 && data.aqi <= 150 && (
              <p>🚨 Unhealthy for sensitive groups. Consider wearing a mask outdoors.</p>
            )}
            {data.aqi > 150 && <p>🔴 Unhealthy air quality. Avoid outdoor activities and keep windows closed.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
