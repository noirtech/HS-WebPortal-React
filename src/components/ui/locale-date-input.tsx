'use client'

import React, { useState, useEffect, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { useLocaleFormatting } from '@/lib/locale-context'

interface LocaleDateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
  'aria-label'?: string
}

export const LocaleDateInput = forwardRef<HTMLInputElement, LocaleDateInputProps>(
  ({ value, onChange, placeholder, className, disabled, required, id, name, 'aria-label': ariaLabel }, ref) => {
    const { formatDate, localeConfig, currentLocale } = useLocaleFormatting()
    const [displayValue, setDisplayValue] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Convert ISO date string to display format
    useEffect(() => {
      if (value) {
        try {
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            setSelectedDate(date)
            // Use a stable reference to prevent infinite loops
            const formattedDate = formatDate(date)
            setDisplayValue(formattedDate)
          } else {
            setDisplayValue('')
            setSelectedDate(null)
          }
        } catch {
          setDisplayValue('')
          setSelectedDate(null)
        }
      } else {
        setDisplayValue('')
        setSelectedDate(null)
      }
    }, [value]) // Remove formatDate dependency to prevent infinite loops

    // Handle display value change (user typing)
    const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setDisplayValue(inputValue)
      
      // Try to parse the input value based on locale
      if (inputValue) {
        let parsedDate: Date | null = null
        
        if (localeConfig.spelling === 'british') {
          // Try DD/MM/YYYY format
          const parts = inputValue.split('/')
          if (parts.length === 3) {
            const day = parseInt(parts[0])
            const month = parseInt(parts[1]) - 1
            const year = parseInt(parts[2])
            parsedDate = new Date(year, month, day)
          }
        } else {
          // Try MM/DD/YYYY format
          const parts = inputValue.split('/')
          if (parts.length === 3) {
            const month = parseInt(parts[0]) - 1
            const day = parseInt(parts[1])
            const year = parseInt(parts[2])
            parsedDate = new Date(year, month, day)
          }
        }
        
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate)
          // Convert to ISO string for the form
          const isoString = parsedDate.toISOString().split('T')[0]
          onChange(isoString)
        }
      } else {
        setSelectedDate(null)
        onChange('')
      }
    }

    // Handle calendar button click
    const handleCalendarClick = () => {
      setIsOpen(!isOpen)
    }

    // Handle date selection from calendar
    const handleDateSelect = (date: Date) => {
      setSelectedDate(date)
      setDisplayValue(formatDate(date))
      const isoString = date.toISOString().split('T')[0]
      onChange(isoString)
      setIsOpen(false)
    }

    // Generate calendar days
    const generateCalendarDays = () => {
      if (!selectedDate) return []
      
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())
      
      const days = []
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        days.push(date)
      }
      
      return days
    }

    const calendarDays = generateCalendarDays()

    return (
      <div className="relative">
        <div className="flex">
          <Input
            ref={ref}
            type="text"
            value={displayValue}
            onChange={handleDisplayChange}
            placeholder={placeholder || (localeConfig.spelling === 'british' ? 'DD/MM/YYYY' : 'MM/DD/YYYY')}
            className={`flex-1 ${className || ''}`}
            disabled={disabled}
            required={required}
            id={id}
            name={name}
            aria-label={ariaLabel}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleCalendarClick}
            disabled={disabled}
            className="ml-2 px-3"
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedDate) {
                    const newDate = new Date(selectedDate)
                    newDate.setMonth(newDate.getMonth() - 1)
                    setSelectedDate(newDate)
                  }
                }}
              >
                ‹
              </Button>
              <div className="font-medium">
                {selectedDate ? selectedDate.toLocaleDateString(currentLocale, { month: 'long', year: 'numeric' }) : ''}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedDate) {
                    const newDate = new Date(selectedDate)
                    newDate.setMonth(newDate.getMonth() + 1)
                    setSelectedDate(newDate)
                  }
                }}
              >
                ›
              </Button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === (selectedDate?.getMonth() || 0)
                const isToday = date.toDateString() === new Date().toDateString()
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={`
                      p-2 text-sm rounded hover:bg-gray-100 transition-colors
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isToday ? 'bg-blue-100 text-blue-900 font-medium' : ''}
                      ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
            
            {/* Quick Actions */}
            <div className="flex justify-between mt-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDateSelect(new Date())}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
)

LocaleDateInput.displayName = 'LocaleDateInput'
