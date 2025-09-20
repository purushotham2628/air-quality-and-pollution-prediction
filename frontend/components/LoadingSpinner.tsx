"use client"

import { motion } from "framer-motion"
import { Wind } from "lucide-react"

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <Wind className="h-8 w-8 text-primary" />
      </motion.div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground">Loading Air Quality Data</h3>
        <p className="text-sm text-muted-foreground">Fetching latest measurements...</p>
      </div>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}
