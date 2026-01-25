import { useState } from 'react'
import { Plus, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TodoInputProps {
  onAdd: (text: string, dueTime?: Date | null) => void;
}

export default function TodoInput({ onAdd }: TodoInputProps) {
  const [text, setText] = useState('')
  const [showDuePicker, setShowDuePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [hour, setHour] = useState('12')
  const [minute, setMinute] = useState('00')
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      let due: Date | null = null
      if (selectedDate) {
        const h = Math.min(23, Math.max(0, parseInt(hour) || 0))
        const m = Math.min(59, Math.max(0, parseInt(minute) || 0))
        due = new Date(`${selectedDate}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
      }
      onAdd(text, due)
      setText('')
      setSelectedDate('')
      setHour('12')
      setMinute('00')
      setShowDuePicker(false)
    }
  }

  const toggleDuePicker = () => {
    if (showDuePicker) {
      setSelectedDate('')
      setHour('12')
      setMinute('00')
    } else {
      setCalendarMonth(new Date())
    }
    setShowDuePicker(!showDuePicker)
  }

  const normalizeHour = (val: string) => {
    const num = parseInt(val) || 0
    return Math.min(23, Math.max(0, num)).toString().padStart(2, '0')
  }

  const normalizeMinute = (val: string) => {
    const num = parseInt(val) || 0
    return Math.min(59, Math.max(0, num)).toString().padStart(2, '0')
  }

  const hasDue = selectedDate !== ''

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (d: Date) => {
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Quick options
  const quickOptions = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'In 3 days', days: 3 },
    { label: 'In a week', days: 7 },
  ]

  const selectQuickOption = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setSelectedDate(formatDateLocal(d))
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return ''
    const [year, month, day] = selectedDate.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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
    setSelectedDate(formatDateLocal(d))
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

    // Weekday headers
    const headers = weekdays.map(w => (
      <div key={w} className="text-[10px] font-semibold text-neu-muted/40 text-center py-1">
        {w}
      </div>
    ))

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />)
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const past = isPast(day)
      const today = isToday(day)
      const selected = isSelected(day)
      
      days.push(
        <button
          key={day}
          type="button"
          disabled={past}
          onClick={() => selectDay(day)}
          className={`
            w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-100 cursor-pointer
            ${selected ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30' :
              today ? 'bg-violet-100 text-violet-600' :
              past ? 'text-neu-muted/20 cursor-not-allowed' :
              'text-neu-text/80 hover:bg-violet-50'}
          `}
        >
          {day}
        </button>
      )
    }

    return { headers, days }
  }

  const { headers, days } = renderCalendar()

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-white/70 backdrop-blur-sm rounded-[18px] px-5 py-3 outline-none text-neu-text placeholder-neu-muted/35 border border-white/60 transition-all duration-200 focus:bg-white/90 focus:border-violet-200 text-sm font-medium shadow-sm"
          />
          
          <button
            type="button"
            onClick={toggleDuePicker}
            className={`w-[46px] h-[46px] rounded-[18px] flex items-center justify-center transition-all duration-200 cursor-pointer border flex-shrink-0 shadow-sm ${
              hasDue
                ? 'bg-violet-500 border-violet-500 text-white shadow-violet-500/20'
                : showDuePicker
                ? 'bg-violet-100 border-violet-200 text-violet-600'
                : 'bg-white/70 border-white/60 text-neu-muted/40 hover:text-violet-500 hover:border-violet-200 hover:bg-white/90'
            }`}
          >
            <Clock size={18} />
          </button>
        </div>
        
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-[18px] w-[46px] h-[46px] flex items-center justify-center text-white shadow-lg shadow-violet-500/25 disabled:opacity-30 disabled:shadow-none transition-all duration-200 cursor-pointer flex-shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </form>
      
      {/* Due Picker */}
      <AnimatePresence>
        {showDuePicker && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 bg-white rounded-2xl border border-violet-100/50 shadow-lg space-y-4 overflow-hidden"
          >
            {/* Quick Options */}
            <div className="grid grid-cols-4 gap-2">
              {quickOptions.map((opt) => {
                const d = new Date()
                d.setDate(d.getDate() + opt.days)
                const val = formatDateLocal(d)
                const isSelected = selectedDate === val
                
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => selectQuickOption(opt.days)}
                    className={`py-2 rounded-xl text-[11px] font-semibold transition-colors duration-100 cursor-pointer ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            
            {/* Custom Calendar */}
            <div className="space-y-3">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neu-muted/50 hover:bg-violet-50 hover:text-violet-500 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-neu-text">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neu-muted/50 hover:bg-violet-50 hover:text-violet-500 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              {/* Calendar Grid - Fixed Columns, Center Items */}
              <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {headers}
                {days}
              </div>
            </div>
            
            {/* Time Input */}
            <div className="flex items-center justify-between pt-4 border-t border-violet-50">
              <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-neu-muted/40 uppercase tracking-wider">Time</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={hour}
                      onChange={(e) => setHour(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      onBlur={() => setHour(normalizeHour(hour))}
                      className="w-8 h-8 rounded-lg bg-violet-50/50 border border-violet-100 text-center text-xs font-bold text-violet-600 outline-none focus:border-violet-300 focus:bg-white transition-colors"
                    />
                    <span className="text-violet-300 font-bold">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={minute}
                      onChange={(e) => setMinute(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      onBlur={() => setMinute(normalizeMinute(minute))}
                      className="w-8 h-8 rounded-lg bg-violet-50/50 border border-violet-100 text-center text-xs font-bold text-violet-600 outline-none focus:border-violet-300 focus:bg-white transition-colors"
                    />
                  </div>
              </div>
              
              <div className="flex gap-1.5">
                {['09', '12', '18'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => { setHour(h); setMinute('00') }}
                    className={`px-2 py-1.5 rounded-[10px] text-[10px] font-semibold transition-all cursor-pointer ${
                      hour === h && minute === '00'
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                        : 'bg-violet-50/50 text-violet-500 hover:bg-violet-100'
                    }`}
                  >
                    {h}:00
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preview */}
            {hasDue && (
              <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] font-semibold text-green-700">
                    {formatSelectedDate()} at {normalizeHour(hour)}:{normalizeMinute(minute)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedDate(''); setHour('12'); setMinute('00') }}
                  className="text-[10px] font-medium text-green-600 hover:text-red-500 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
