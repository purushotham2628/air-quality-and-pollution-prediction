"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { Wind, Activity, TrendingUp, AlertTriangle, CheckCircle, XCircle, BarChart3, Clock, MapPin } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AirQualityChart from "@/components/AirQualityChart"
import PredictionChart from "@/components/PredictionChart"
import WeatherWidget from "@/components/WeatherWidget"
import MetricsGrid from "@/components/MetricsGrid"
import AlertsPanel from "@/components/AlertsPanel"
import LoadingSpinner from "@/components/LoadingSpinner"

const fetcher = (url: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`).then((res) => res.json())

export default function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState("bengaluru")
  const [timeRange, setTimeRange] = useState("24")

  // Fetch current air quality data
  const {
    data: currentData,
    error: currentError,
    isLoading: currentLoading,
  } = useSWR(
    `/air-quality/current/${selectedLocation}`,
    fetcher,
    { refreshInterval: 300000 }, // Refresh every 5 minutes
  )

  // Fetch historical data
  const { data: historicalData, error: historicalError } = useSWR(
    `/air-quality/history/${selectedLocation}?hours=${timeRange}`,
    fetcher,
    { refreshInterval: 600000 }, // Refresh every 10 minutes
  )

  // Fetch predictions
  const { data: predictionsData } = useSWR(
    `/predictions/${selectedLocation}?hours=24`,
    fetcher,
    { refreshInterval: 1800000 }, // Refresh every 30 minutes
  )

  // Get AQI status
  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "bg-green-500", textColor: "text-green-400" }
    if (aqi <= 100) return { label: "Moderate", color: "bg-yellow-500", textColor: "text-yellow-400" }
    if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "bg-orange-500", textColor: "text-orange-400" }
    if (aqi <= 200) return { label: "Unhealthy", color: "bg-red-500", textColor: "text-red-400" }
    if (aqi <= 300) return { label: "Very Unhealthy", color: "bg-purple-500", textColor: "text-purple-400" }
    return { label: "Hazardous", color: "bg-red-800", textColor: "text-red-400" }
  }

  if (currentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (currentError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>Failed to load air quality data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const aqiStatus = currentData?.data ? getAQIStatus(currentData.data.aqi) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Wind className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold gradient-text">AirSense</h1>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Advanced ML Monitoring
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="capitalize">{selectedLocation}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Live</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Current Status Hero Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-0 bg-gradient-to-br from-card/80 to-card/40">
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* AQI Display */}
                <div className="lg:col-span-1 text-center">
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="text-6xl font-bold text-foreground">{currentData?.data?.aqi || "--"}</div>
                      <div className="absolute -top-2 -right-2">
                        <div className={`w-4 h-4 rounded-full ${aqiStatus?.color} animate-pulse-glow`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline" className={`${aqiStatus?.textColor} border-current`}>
                        {aqiStatus?.label || "Unknown"}
                      </Badge>
                      <p className="text-sm text-muted-foreground">Air Quality Index</p>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} className="text-center p-4 rounded-lg bg-background/50">
                      <div className="text-2xl font-semibold text-chart-1">
                        {currentData?.data?.pm25?.toFixed(1) || "--"}
                      </div>
                      <div className="text-xs text-muted-foreground">PM2.5 μg/m³</div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} className="text-center p-4 rounded-lg bg-background/50">
                      <div className="text-2xl font-semibold text-chart-2">
                        {currentData?.data?.pm10?.toFixed(1) || "--"}
                      </div>
                      <div className="text-xs text-muted-foreground">PM10 μg/m³</div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} className="text-center p-4 rounded-lg bg-background/50">
                      <div className="text-2xl font-semibold text-chart-3">
                        {currentData?.data?.no2?.toFixed(1) || "--"}
                      </div>
                      <div className="text-xs text-muted-foreground">NO2 μg/m³</div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} className="text-center p-4 rounded-lg bg-background/50">
                      <div className="text-2xl font-semibold text-chart-4">
                        {currentData?.data?.o3?.toFixed(1) || "--"}
                      </div>
                      <div className="text-xs text-muted-foreground">O3 μg/m³</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Weather Widget */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <WeatherWidget data={currentData?.data} />
        </motion.section>

        {/* Main Dashboard Tabs */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trends</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Predictions</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AirQualityChart data={historicalData?.data || []} />
                </div>
                <div>
                  <MetricsGrid data={currentData?.data} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historical Trends</CardTitle>
                    <CardDescription>Air quality patterns over the selected time period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AirQualityChart data={historicalData?.data || []} showTrends={true} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <PredictionChart data={predictionsData?.data || []} />
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <AlertsPanel currentData={currentData?.data} />
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Time Range Selector */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <div className="flex items-center space-x-2 bg-card rounded-lg p-1">
            {["6", "12", "24", "48", "168"].map((hours) => (
              <Button
                key={hours}
                variant={timeRange === hours ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(hours)}
                className="text-xs"
              >
                {hours === "168" ? "7d" : `${hours}h`}
              </Button>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Powered by OpenWeather API</span>
              <span>•</span>
              <span>ML Predictions v1.0</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>System Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
