"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AirQualityData {
  timestamp: string
  pm25: number
  pm10: number
  no2: number
  aqi: number
}

interface AirQualityChartProps {
  data: AirQualityData[]
  showTrends?: boolean
}

export default function AirQualityChart({ data, showTrends = false }: AirQualityChartProps) {
  const chartData = useMemo(() => {
    return data
      .slice(0, 50) // Limit to last 50 data points for performance
      .reverse() // Show chronological order
      .map((item) => ({
        ...item,
        time: format(new Date(item.timestamp), "HH:mm"),
        fullTime: format(new Date(item.timestamp), "MMM dd, HH:mm"),
      }))
  }, [data])

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
                <span className="text-xs font-medium">{entry.value}</span>
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
          <CardTitle>Air Quality Trends</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No historical data to display
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Air Quality Trends
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
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
        </CardTitle>
        <CardDescription>Real-time air quality measurements over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {showTrends ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pm10Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pm25"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#pm25Gradient)"
                  name="PM2.5"
                />
                <Area
                  type="monotone"
                  dataKey="pm10"
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#pm10Gradient)"
                  name="PM10"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="pm25"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
                  name="PM2.5"
                />
                <Line
                  type="monotone"
                  dataKey="pm10"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-2))", strokeWidth: 2 }}
                  name="PM10"
                />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-3))", strokeWidth: 2 }}
                  name="AQI"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
