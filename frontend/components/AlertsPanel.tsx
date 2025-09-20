"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, Info, Shield, Wind, Thermometer } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AirQualityData {
  pm25: number
  pm10: number
  no2: number
  aqi: number
  temperature: number
  humidity: number
}

interface AlertsPanelProps {
  currentData: AirQualityData | null
}

export default function AlertsPanel({ currentData }: AlertsPanelProps) {
  const alerts = useMemo(() => {
    if (!currentData) return []

    const alertList = []

    // AQI-based alerts
    if (currentData.aqi > 150) {
      alertList.push({
        id: "aqi-unhealthy",
        type: "error",
        icon: AlertTriangle,
        title: "Unhealthy Air Quality",
        message: "AQI is above 150. Avoid outdoor activities and keep windows closed.",
        severity: "high",
      })
    } else if (currentData.aqi > 100) {
      alertList.push({
        id: "aqi-sensitive",
        type: "warning",
        icon: AlertTriangle,
        title: "Unhealthy for Sensitive Groups",
        message: "People with respiratory conditions should limit outdoor exposure.",
        severity: "medium",
      })
    } else if (currentData.aqi > 50) {
      alertList.push({
        id: "aqi-moderate",
        type: "info",
        icon: Info,
        title: "Moderate Air Quality",
        message: "Air quality is acceptable for most people.",
        severity: "low",
      })
    }

    // PM2.5 specific alerts
    if (currentData.pm25 > 55.4) {
      alertList.push({
        id: "pm25-high",
        type: "error",
        icon: Wind,
        title: "High PM2.5 Levels",
        message: `PM2.5 is ${currentData.pm25.toFixed(1)} μg/m³. Consider wearing N95 masks outdoors.`,
        severity: "high",
      })
    }

    // Temperature-based air quality correlation
    if (currentData.temperature > 35) {
      alertList.push({
        id: "heat-pollution",
        type: "warning",
        icon: Thermometer,
        title: "High Temperature Alert",
        message: "Hot weather can worsen air pollution effects. Stay hydrated and limit outdoor activities.",
        severity: "medium",
      })
    }

    // Good air quality message
    if (currentData.aqi <= 50) {
      alertList.push({
        id: "good-air",
        type: "success",
        icon: CheckCircle,
        title: "Good Air Quality",
        message: "Air quality is good. Perfect time for outdoor activities!",
        severity: "low",
      })
    }

    return alertList
  }, [currentData])

  const getAlertColor = (type: string) => {
    switch (type) {
      case "error":
        return "border-red-500 bg-red-500/10 text-red-400"
      case "warning":
        return "border-yellow-500 bg-yellow-500/10 text-yellow-400"
      case "success":
        return "border-green-500 bg-green-500/10 text-green-400"
      default:
        return "border-blue-500 bg-blue-500/10 text-blue-400"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="text-xs border-green-500 text-green-400">
            Low
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Info
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Health Alerts & Recommendations</span>
          </CardTitle>
          <CardDescription>Real-time health advisories based on current air quality conditions</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>No alerts at this time</p>
              <p className="text-xs">Air quality data is being processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => {
                const IconComponent = alert.icon
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Alert className={`${getAlertColor(alert.type)} border`}>
                      <div className="flex items-start space-x-3">
                        <IconComponent className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{alert.title}</h4>
                            {getSeverityBadge(alert.severity)}
                          </div>
                          <AlertDescription className="text-xs">{alert.message}</AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>General Health Guidelines</CardTitle>
          <CardDescription>Protective measures for different air quality levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h4 className="font-medium text-sm text-green-400 mb-2">Good (0-50 AQI)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Enjoy outdoor activities</li>
                  <li>• Open windows for fresh air</li>
                  <li>• No health precautions needed</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <h4 className="font-medium text-sm text-yellow-400 mb-2">Moderate (51-100 AQI)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Sensitive people should limit outdoor exposure</li>
                  <li>• Consider air purifiers indoors</li>
                  <li>• Monitor symptoms if sensitive</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <h4 className="font-medium text-sm text-orange-400 mb-2">Unhealthy for Sensitive (101-150 AQI)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Wear masks when outdoors</li>
                  <li>• Limit outdoor exercise</li>
                  <li>• Keep windows closed</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <h4 className="font-medium text-sm text-red-400 mb-2">Unhealthy (151+ AQI)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Avoid outdoor activities</li>
                  <li>• Use N95 masks if going outside</li>
                  <li>• Run air purifiers continuously</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
