import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { Language } from '../i18n'
import { getTranslation } from '../i18n'

interface DatePickerProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  hour: string
  minute: string
  onHourChange: (hour: string) => void
  onMinuteChange: (minute: string) => void
  language: Language
  showQuickOptions?: boolean
  compact?: boolean
  darkMode?: boolean
}

// Helper to format date as YYYY-MM-DD in local timezone
export const formatDateLocal = (d: Date): string => {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const normalizeHour = (val: string): string => {
  const num = parseInt(val) || 0
  return Math.min(23, Math.max(0, num)).toString().padStart(2, '0')
}

export const normalizeMinute = (val: string): string => {
  const num = parseInt(val) || 0
  return Math.min(59, Math.max(0, num)).toString().padStart(2, '0')
}

export default function DatePicker({
  selectedDate,
  onSelectDate,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  language,
  showQuickOptions = true,
  compact = false,
  darkMode = false
}: DatePickerProps) {
  const t = getTranslation(language)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-').map(Number)
      return new Date(year, month - 1, 1)
    }
    return new Date()
  })
  const minuteInputRef = useRef<HTMLInputElement>(null)

  // Quick options
  const quickOptions = [
    { label: t.today, days: 0 },
    { label: t.tomorrow, days: 1 },
    { label: t.threeDays, days: 3 },
    { label: t.nextWeek, days: 7 },
  ]

  const selectQuickOption = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    onSelectDate(formatDateLocal(d))
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
  }

  const selectDay = (day: number) => {
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    const dateStr = formatDateLocal(d)
    console.log('[DatePicker] selectDay called, day:', day, 'dateStr:', dateStr)
    onSelectDate(dateStr)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return calendarMonth.getFullYear() === today.getFullYear() &&
           calendarMonth.getMonth() === today.getMonth() &&
           day === today.getDate()
  }

  const isPast = (day: number) => {
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d < today
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    return formatDateLocal(d) === selectedDate
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth)
    const firstDay = getFirstDayOfMonth(calendarMonth)
    const days = []
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    const headers = weekdays.map(w => (
      <div key={w} className={`text-[10px] font-semibold text-center py-1 ${darkMode ? 'text-neu-dark-muted/40' : 'text-neu-muted/40'}`}>
        {w}
      </div>
    ))

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const past = isPast(day)
      const today = isToday(day)
      const selected = isSelected(day)

      days.push(
        <button
          key={day}
          type="button"
          disabled={past}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            console.log('[DatePicker] button mousedown, day:', day, 'past:', past)
            if (!past) selectDay(day)
          }}
          onClick={(e) => {
            e.stopPropagation()
            console.log('[DatePicker] button clicked, day:', day, 'past:', past)
          }}
          className={clsx(
            "w-7 h-7 rounded-lg text-xs font-semibold transition-all duration-100 cursor-pointer relative z-20",
            selected ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30' :
            today ? (darkMode ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600') :
            past ? (darkMode ? 'text-neu-dark-muted/20 cursor-not-allowed' : 'text-neu-muted/20 cursor-not-allowed') :
            darkMode ? 'text-neu-dark-text/80 hover:bg-violet-500/10' : 'text-neu-text/80 hover:bg-violet-50'
          )}
          style={{ pointerEvents: past ? 'none' : 'auto' }}
        >
          {day}
        </button>
      )
    }

    return { headers, days }
  }

  const { headers, days } = renderCalendar()

  const formatSelectedDate = () => {
    if (!selectedDate) return ''
    const [year, month, day] = selectedDate.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const hasDue = selectedDate !== ''

  return (
    <div className={clsx("space-y-3", compact && "space-y-2")}>
      {/* Quick Options */}
      {showQuickOptions && (
        <div className="grid grid-cols-2 gap-2">
          {quickOptions.map((opt) => {
            const d = new Date()
            d.setDate(d.getDate() + opt.days)
            const val = formatDateLocal(d)
            const optSelected = selectedDate === val

            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => selectQuickOption(opt.days)}
                className={clsx(
                  "py-2 rounded-xl text-[11px] font-semibold transition-colors duration-100 cursor-pointer",
                  optSelected
                    ? 'bg-violet-500 text-white'
                    : darkMode
                    ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                    : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="space-y-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              darkMode ? 'text-neu-dark-muted/50 hover:bg-violet-500/10 hover:text-violet-400' : 'text-neu-muted/50 hover:bg-violet-50 hover:text-violet-500'
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={clsx("font-semibold", compact ? "text-[10px]" : "text-sm", darkMode ? 'text-neu-dark-text' : 'text-neu-text')}>
            {calendarMonth.toLocaleDateString('en-US', { month: compact ? 'short' : 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              darkMode ? 'text-neu-dark-muted/50 hover:bg-violet-500/10 hover:text-violet-400' : 'text-neu-muted/50 hover:bg-violet-50 hover:text-violet-500'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className={clsx("grid grid-cols-7 justify-items-center relative z-10", compact ? "gap-y-0.5" : "gap-y-1")}>
          {headers}
          {days}
        </div>
      </div>

      {/* Time Input */}
      <div className={clsx("flex flex-col gap-3 pt-3 border-t", compact && "pt-2 gap-2", darkMode ? 'border-white/10' : 'border-violet-50')}>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-neu-dark-muted/40' : 'text-neu-muted/40'}`}>Time</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={hour}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                onHourChange(val)
                if (val.length === 2) {
                  onHourChange(normalizeHour(val))
                  minuteInputRef.current?.focus()
                  minuteInputRef.current?.select()
                }
              }}
              onBlur={(e) => onHourChange(normalizeHour(e.target.value))}
              className={`w-8 h-8 rounded-lg border text-center text-xs font-bold outline-none transition-colors ${
                darkMode
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 focus:border-violet-400 focus:bg-violet-500/20'
                  : 'bg-violet-50/50 border-violet-100 text-violet-600 focus:border-violet-300 focus:bg-white'
              }`}
            />
            <span className={`font-bold ${darkMode ? 'text-violet-500/50' : 'text-violet-300'}`}>:</span>
            <input
              ref={minuteInputRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={minute}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onMinuteChange(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={(e) => onMinuteChange(normalizeMinute(e.target.value))}
              className={`w-8 h-8 rounded-lg border text-center text-xs font-bold outline-none transition-colors ${
                darkMode
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 focus:border-violet-400 focus:bg-violet-500/20'
                  : 'bg-violet-50/50 border-violet-100 text-violet-600 focus:border-violet-300 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-3 gap-2">
            {['09', '12', '18'].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => { onHourChange(h); onMinuteChange('00') }}
                className={clsx(
                  "px-2 py-1.5 rounded-[10px] text-[10px] font-semibold transition-all cursor-pointer",
                  hour === h && minute === '00'
                    ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                    : darkMode
                    ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                    : 'bg-violet-50/50 text-violet-500 hover:bg-violet-100'
                )}
              >
                {h}:00
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {hasDue && !compact && (
        <div className={`flex items-center justify-between py-2 px-3 rounded-xl ${darkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className={`text-[11px] font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
              {formatSelectedDate()} {language === 'zh' ? ' ' : 'at'} {normalizeHour(hour)}:{normalizeMinute(minute)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { onSelectDate(''); onHourChange('12'); onMinuteChange('00') }}
            className={`text-[10px] font-medium cursor-pointer ${darkMode ? 'text-green-400 hover:text-red-400' : 'text-green-600 hover:text-red-500'}`}
          >
            {language === 'zh' ? '清除' : 'Clear'}
          </button>
        </div>
      )}
    </div>
  )
}
