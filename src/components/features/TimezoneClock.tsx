'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, MapPin, Heart, Globe, ArrowLeftRight, Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedTime, format as formatTz } from 'date-fns-tz'

interface TimezoneClockProps {
  partnerOne: {
    name: string
    timezone: string
    location: string
    latitude?: number
    longitude?: number
  }
  partnerTwo: {
    name: string
    timezone: string
    location: string
    latitude?: number
    longitude?: number
  }
  distanceKm?: number
  anniversaryDate?: string
  className?: string
}

export function TimezoneClock({
  partnerOne,
  partnerTwo,
  distanceKm,
  anniversaryDate,
  className = '',
}: TimezoneClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [distance, setDistance] = useState(distanceKm || 0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (partnerOne.latitude && partnerOne.longitude && partnerTwo.latitude && partnerTwo.longitude) {
      const d = calculateDistance(
        partnerOne.latitude,
        partnerOne.longitude,
        partnerTwo.latitude,
        partnerTwo.longitude
      )
      setDistance(d)
    }
  }, [partnerOne.latitude, partnerOne.longitude, partnerTwo.latitude, partnerTwo.longitude])

  const getTimeInZone = (timezone: string) => {
    try {
      return toZonedTime(currentTime, timezone)
    } catch {
      return currentTime
    }
  }

  const formatTime = (date: Date, timezone: string) => {
    try {
      return formatTz(date, 'h:mm a', { timeZone: timezone })
    } catch {
      return format(date, 'h:mm a')
    }
  }

  const formatDate = (date: Date, timezone: string) => {
    try {
      return formatTz(date, 'EEEE, MMMM d', { timeZone: timezone })
    } catch {
      return format(date, 'EEEE, MMMM d')
    }
  }

  const isDaytime = (timezone: string) => {
    try {
      const zoned = toZonedTime(currentTime, timezone)
      const hours = zoned.getHours()
      return hours >= 6 && hours < 18
    } catch {
      return true
    }
  }

  const timeOne = getTimeInZone(partnerOne.timezone)
  const timeTwo = getTimeInZone(partnerTwo.timezone)
  const dayOne = isDaytime(partnerOne.timezone)
  const dayTwo = isDaytime(partnerTwo.timezone)

  // Calculate time difference
  const getTimeDifference = () => {
    const offset1 = new Date().toLocaleString('en-US', { timeZone: partnerOne.timezone, timeZoneName: 'short' })
    const offset2 = new Date().toLocaleString('en-US', { timeZone: partnerTwo.timezone, timeZoneName: 'short' })
    // Simplified - in production use proper timezone diff
    return Math.abs(timeOne.getHours() - timeTwo.getHours())
  }

  const hoursDiff = getTimeDifference()

  return (
    <motion.div
      className={`card p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-semibold text-sky-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-500" aria-hidden="true" />
          Across the Miles
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-sm font-medium">
          <Heart className="w-4 h-4 animate-heartbeat" aria-hidden="true" />
          <span>{hoursDiff}h apart</span>
        </div>
      </div>

      {/* Two Timezones Side by Side */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { partner: partnerOne, time: timeOne, isDay: dayOne, label: 'You' },
          { partner: partnerTwo, time: timeTwo, isDay: dayTwo, label: 'Them' },
        ].map(({ partner, time, isDay, label }) => (
          <motion.div
            key={partner.name}
            className="relative p-4 rounded-2xl bg-gradient-to-br from-cream-50 to-white border border-sky-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: label === 'You' ? 0.1 : 0.2 }}
          >
            {/* Day/Night indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur text-xs font-medium">
              {isDay ? (
                <>
                  <Sun className="w-3 h-3 text-gold-500" aria-hidden="true" />
                  <span className="text-gold-600">Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-lavender-500" aria-hidden="true" />
                  <span className="text-lavender-600">Night</span>
                </>
              )}
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <MapPin className="w-4 h-4 text-sky-400" aria-hidden="true" />
                <span className="font-medium text-sky-700 text-sm">{partner.location}</span>
              </div>
              <p className="text-sky-500 text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className="font-sans text-3xl md:text-4xl font-bold text-sky-900 font-mono">
                {formatTime(time, partner.timezone)}
              </p>
              <p className="font-serif text-sm text-sky-500 mt-1">
                {formatDate(time, partner.timezone)}
              </p>
              <p className="text-sky-400 text-xs mt-2">
                {partner.timezone}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Distance Counter */}
      {(distance > 0 || distanceKm) && (
        <motion.div
          className="relative p-6 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute inset-0 bg-[url('/images/hearts-pattern.svg')] opacity-10" aria-hidden="true" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <MapPin className="w-8 h-8" aria-hidden="true" />
              </motion.div>
              <div>
                <p className="text-sky-100 text-sm uppercase tracking-wider">Distance Between You</p>
                <motion.p
                  className="font-serif text-3xl md:text-4xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {distance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} km
                </motion.p>
                <p className="text-sky-100/80 text-sm mt-1">
                  ≈ {(distance / 1.609).toLocaleString(undefined, { maximumFractionDigits: 0 })} miles
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sky-100 text-sm uppercase tracking-wider">Time Difference</p>
              <motion.p
                className="font-serif text-2xl md:text-3xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {hoursDiff} hour{hoursDiff !== 1 ? 's' : ''}
              </motion.p>
              <p className="text-sky-100/80 text-sm mt-1">
                {hoursDiff === 0 ? 'Same timezone!' : 'apart'}
              </p>
            </div>
          </div>

          {/* Cute message */}
          <motion.p
            className="absolute bottom-4 right-4 text-sky-100/60 text-sm font-handwriting text-right max-w-xs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            "Distance means so little when someone means so much" 💕
          </motion.p>
        </motion.div>
      )}

      {/* Anniversary Countdown */}
      {anniversaryDate && (
        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-lavender-50 to-sky-50 border border-lavender-100"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-lavender-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-lavender-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sky-500 text-sm uppercase tracking-wider">Anniversary</p>
                <p className="font-serif text-lg font-semibold text-sky-900">
                  {format(new Date(anniversaryDate), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <AnniversaryCountdown targetDate={anniversaryDate} />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function AnniversaryCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const target = new Date(targetDate)
      // Set to start of day for anniversary
      target.setHours(0, 0, 0, 0)
      
      // If anniversary passed this year, set to next year
      if (target < now) {
        target.setFullYear(target.getFullYear() + 1)
      }

      const diff = target.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
    return (
      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500 text-white font-medium"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Heart className="w-4 h-4 animate-heartbeat" aria-hidden="true" />
        <span>Happy Anniversary! 🎉</span>
      </motion.div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {timeLeft.days > 0 && (
        <CountdownUnit value={timeLeft.days} label="days" />
      )}
      <CountdownUnit value={timeLeft.hours} label="h" />
      <CountdownUnit value={timeLeft.minutes} label="m" />
      <CountdownUnit value={timeLeft.seconds} label="s" />
    </div>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white shadow-sm border border-lavender-200"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="font-mono font-bold text-sky-700 min-w-[1.5ch] text-right">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-sky-500 text-xs">{label}</span>
    </motion.div>
  )
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}