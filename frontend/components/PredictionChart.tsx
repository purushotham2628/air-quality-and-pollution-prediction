"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { format, addHours, parseISO, isValid } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Brain, CircleAlert as AlertCircle } from "lucide-react"

interface PredictionData {
  timestamp: string
  type: string
  value: number
  confidence: number
  horizon: number
}

interface PredictionChartProps {
  data: PredictionData[]
}

export default function PredictionChart({ data }: PredictionChartProps) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || !data.length) return []

    // Group predictions by horizon (time)
    const groupedData = data.reduce((acc, item) => {
      if (!item || typeof item.horizon !== 'number') return acc
      
      const key = item.horizon
      if (!acc[key]) {
        const futureTime = addHours(new Date(), key)
        acc[key] = {
          horizon: key,
          timestamp: futureTime.toISOString(),
          time: format(futureTime, "HH:mm"),
          fullTime: format(futureTime, "MMM dd, HH:mm"),
        }
      }

      if (item.type === "pm25" && typeof item.value === 'number') {
        acc[key].pm25 = item.value
        acc[key].pm25_confidence = item.confidence
      } else if (item.type === "pm10" && typeof item.value === 'number') {
        acc[key].pm10 = item.value
        acc[key].pm10_confidence = item.confidence
      } else if (item.type === "aqi" && typeof item.value === 'number') {
        acc[key].aqi = item.value
        acc[key].aqi_confidence = item.confidence
      }

      return acc
    }, {} as any)

    return Object.values(groupedData).slice(0, 24) // Show next 24 hours
  }, [data])

  const avgConfidence = useMemo(() => {
    if (!data || !Array.isArray(data) || !data.length) return 0
    return data.reduce((sum, item) => sum + item.confidence, 0) / data.length
  }, [data])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-400"
    if (confidence >= 0.6) return "text-yellow-400"
    return "text-red-400"
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{data.fullTime}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">{entry.value}</div>
                  {data[`${entry.dataKey}_confidence`] && (
                    <div className="text-xs text-muted-foreground">
                      {(data[`${entry.dataKey}_confidence`] * 100).toFixed(0)}% confidence
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>ML Predictions</span>
          </CardTitle>
          <CardDescription>No prediction data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto" />
              <p>Insufficient historical data for predictions</p>
              <p className="text-xs">Collect more data to enable ML forecasting</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>ML Predictions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={`${getConfidenceColor(avgConfidence)} border-current`}>
              {(avgConfidence * 100).toFixed(0)}% Confidence
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>24-hour air quality forecasts using machine learning models</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Confidence Indicator */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Model Performance</span>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-chart-1 rounded-full" />
                <span>PM2.5</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-chart-2 rounded-full" />
                <span>PM10</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-chart-3 rounded-full" />
                <span>AQI</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />

                {/* Current time reference line */}
                <ReferenceLine
                  x={format(new Date(), "HH:mm")}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{ value: "Now", position: "top" }}
                />

                <Line
                  type="monotone"
                  dataKey="pm25"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
                  name="PM2.5 (Predicted)"
                />
                <Line
                  type="monotone"
                  dataKey="pm10"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: "hsl(var(--chart-2))", strokeWidth: 2 }}
                  name="PM10 (Predicted)"
                />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: "hsl(var(--chart-3))", strokeWidth: 2 }}
                  name="AQI (Predicted)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Prediction Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-semibold text-chart-1">{chartData[0]?.pm25?.toFixed(1) || "--"}</div>
              <div className="text-xs text-muted-foreground">Next Hour PM2.5</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-chart-2">{chartData[0]?.pm10?.toFixed(1) || "--"}</div>
              <div className="text-xs text-muted-foreground">Next Hour PM10</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-chart-3">{chartData[0]?.aqi?.toFixed(0) || "--"}</div>
              <div className="text-xs text-muted-foreground">Next Hour AQI</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
