"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }
  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(formatDate(value))
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setInputValue(formatDate(value))
  }, [value])

  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
    setInputValue(inputVal)
    
    // Tentar parsear a data do input
    const parsedDate = new Date(inputVal)
    if (isValidDate(parsedDate)) {
      onChange(parsedDate)
    }
  }

  const handleDateSelect = (day: number) => {
    const currentDate = value || new Date()
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onChange(newDate)
    setInputValue(formatDate(newDate))
    setOpen(false)
  }

  const handleMonthChange = (monthStr: string) => {
    const currentDate = value || new Date()
    const newDate = new Date(currentDate)
    newDate.setMonth(parseInt(monthStr))
    onChange(newDate)
  }

  const handleYearChange = (yearStr: string) => {
    const currentDate = value || new Date()
    const newDate = new Date(currentDate)
    newDate.setFullYear(parseInt(yearStr))
    onChange(newDate)
  }

  const renderCalendar = () => {
    const currentDate = value || new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    const today = new Date()
    
    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day)
      const isToday = dayDate.toDateString() === today.toDateString()
      const isSelected = value && dayDate.toDateString() === value.toDateString()
      const isDisabled = dayDate > today || dayDate < new Date("1900-01-01")
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleDateSelect(day)}
          disabled={isDisabled}
          className={cn(
            "w-8 h-8 text-sm rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            isToday && !isSelected && "bg-accent text-accent-foreground",
            isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed"
          )}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  const currentDate = value || new Date()
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  // Gerar lista de anos (últimos 100 anos)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        value={inputValue}
        placeholder={placeholder}
        className="pr-10"
        disabled={disabled}
        onChange={handleInputChange}
        onFocus={() => !disabled && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 p-0"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <CalendarIcon className="h-4 w-4" />
      </Button>
      
      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 z-50 mt-2 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <select
                value={currentDate.getMonth()}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-32"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => handleYearChange(e.target.value)}
                className="appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-24"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="w-8 h-8 text-xs font-medium text-muted-foreground flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  )
} 