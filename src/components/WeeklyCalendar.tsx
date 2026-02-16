import { useState } from 'react';

// Native date helpers to replace date-fns
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isToday = (date: Date) => {
  return isSameDay(date, new Date());
};

const formatDate = (date: Date, formatStr: string) => {
  if (formatStr === 'eee') {
    return date.toLocaleDateString('it-IT', { weekday: 'short' });
  }
  if (formatStr === 'd') {
    return date.getDate().toString();
  }
  return date.toISOString();
};

// Define the EventItem interface
interface EventItem { id: string; title: string; date: string; type: 'escursione' | 'corso'; }

interface WeeklyCalendarProps {
  events: EventItem[];
}

export default function WeeklyCalendar({ events }: WeeklyCalendarProps) {
  const [currentWeekStart] = useState(getStartOfWeek(new Date()));

  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Settimana Corrente</h2>
        {/* Navigation for weeks can be added here later */}
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {daysOfWeek.map((day, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg flex flex-col items-center justify-center
              ${isToday(day) ? 'bg-brand-sky/20 shadow-md' : ''}
              ${isSameDay(day, new Date()) ? 'border-2 border-brand-sky' : ''}
            `}
          >
            <span className="text-xs font-medium text-gray-500 uppercase">
              {formatDate(day, 'eee')} {/* Mon, Tue, etc. */}
            </span>
            <span className="text-lg font-bold text-gray-800">
              {formatDate(day, 'd')} {/* Day number */}
            </span>
            {events.some(event => isSameDay(new Date(event.date), day)) && (
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-1"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}