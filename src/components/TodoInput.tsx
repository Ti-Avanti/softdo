import { useState } from 'react'
import { Plus, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTranslation } from '../i18n'
import type { Language } from '../i18n'
import DatePicker from './DatePicker'

interface TodoInputProps {
  onAdd: (text: string, dueTime?: Date | null) => void
  language: Language
  darkMode?: boolean
}

export default function TodoInput({ onAdd, language, darkMode = false }: TodoInputProps) {
  const t = getTranslation(language)
  const [text, setText] = useState('')
  const [showDuePicker, setShowDuePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [hour, setHour] = useState('12')
  const [minute, setMinute] = useState('00')

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
    }
    setShowDuePicker(!showDuePicker)
  }

  const hasDue = selectedDate !== ''

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.whatNeedsToBeDone}
            className={`w-full backdrop-blur-xl rounded-[18px] px-5 py-3 outline-none placeholder-neu-muted/35 border transition-all duration-200 text-sm font-medium shadow-sm ${
              darkMode
                ? 'bg-white/5 border-white/10 text-neu-dark-text focus:bg-white/10 focus:border-violet-500/50'
                : 'bg-white/70 border-white/60 text-neu-text focus:bg-white/95 focus:border-violet-200'
            }`}
          />

          <button
            type="button"
            onClick={toggleDuePicker}
            className={`w-[46px] h-[46px] rounded-[18px] flex items-center justify-center transition-all duration-200 cursor-pointer border flex-shrink-0 shadow-sm ${
              hasDue
                ? 'bg-violet-500 border-violet-500 text-white shadow-violet-500/20'
                : showDuePicker
                ? darkMode ? 'bg-violet-500/20 border-violet-500/30 text-violet-400' : 'bg-violet-100 border-violet-200 text-violet-600'
                : darkMode
                ? 'bg-white/5 border-white/10 text-neu-dark-muted hover:text-violet-400 hover:border-violet-500/30 hover:bg-white/10'
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
            className={`p-3 rounded-2xl border shadow-lg overflow-hidden ${
              darkMode ? 'bg-neu-dark-surface border-white/10' : 'bg-white border-violet-100/50'
            }`}
          >
            <DatePicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              hour={hour}
              minute={minute}
              onHourChange={setHour}
              onMinuteChange={setMinute}
              language={language}
              showQuickOptions={true}
              compact={false}
              darkMode={darkMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
