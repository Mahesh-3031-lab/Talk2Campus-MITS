import { useState } from 'react';
import SEOHead from "@/components/SEOHead";
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Plus, Trash2, BookOpen, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTimetable } from '@/hooks/useTimetable';
import { DAYS, DayOfWeek, formatTime, getTodayDay } from '@/lib/timetable';

const BUILDINGS = [
  'KK Block', 'Main Block', 'Lakshmi Block', 'Circular Block',
  'NPN Block', 'Industrial Block', 'Saraswathi Block', 'West Block', 'Library',
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

export default function TimetablePage() {
  const navigate = useNavigate();
  const { entries, upcoming, add, remove } = useTimetable();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDay());

  // Add form state
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [building, setBuilding] = useState(BUILDINGS[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [formDay, setFormDay] = useState<DayOfWeek>(getTodayDay());

  const handleAdd = () => {
    if (!subject.trim() || !room.trim()) return;
    add({ day: formDay, startTime, endTime, subject: subject.trim(), room: room.trim(), building });
    setSubject('');
    setRoom('');
    setShowAdd(false);
  };

  const dayEntries = entries
    .filter(e => e.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const today = getTodayDay();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-muted/30">
      <SEOHead title="Timetable – My Class Schedule at MITS" description="View and manage your class timetable at MITS. Add classes, set reminders, and stay organized." path="/timetable" />
      {/* Header */}
      <div className="sticky top-0 z-20 glass px-4 py-4 border-b border-border/30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded-full p-2 hover:bg-primary/10 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                My Timetable
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your class schedule</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)} variant={showAdd ? 'secondary' : 'default'}>
            {showAdd ? <ChevronUp className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showAdd ? 'Close' : 'Add Class'}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Upcoming classes banner */}
        {upcoming.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary-light/10 border border-primary/20 p-4 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">Upcoming Today</p>
            {upcoming.map(({ entry, minutesUntil, isOngoing }) => (
              <div key={entry.id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isOngoing ? 'bg-green-500 animate-pulse' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.room}, {entry.building} · {formatTime(entry.startTime)}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isOngoing 
                    ? 'bg-green-500/10 text-green-600' 
                    : minutesUntil <= 15 
                      ? 'bg-amber-500/10 text-amber-600' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isOngoing ? 'Now' : `${minutesUntil}m`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add class form */}
        {showAdd && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <p className="text-sm font-medium text-foreground">Add a Class</p>
            <Input
              placeholder="Subject name"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={60}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Room (e.g. Room 305)"
                value={room}
                onChange={e => setRoom(e.target.value)}
                maxLength={30}
              />
              <select
                value={building}
                onChange={e => setBuilding(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={formDay}
                onChange={e => setFormDay(e.target.value as DayOfWeek)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIME_SLOTS.map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
              </select>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIME_SLOTS.map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
              </select>
            </div>
            <Button onClick={handleAdd} disabled={!subject.trim() || !room.trim()} className="w-full">
              Add to Timetable
            </Button>
          </div>
        )}

        {/* Day selector */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedDay === day
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : day === today
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Day schedule */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{selectedDay}'s Schedule</p>
          {dayEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No classes on {selectedDay}</p>
              <p className="text-xs mt-1">Tap "Add Class" to add one</p>
            </div>
          ) : (
            dayEntries.map(entry => (
              <div
                key={entry.id}
                className="rounded-xl border border-border bg-card p-3 flex items-start gap-3 group hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col items-center text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3.5 h-3.5 mb-0.5" />
                  <span>{formatTime(entry.startTime)}</span>
                  <span className="text-[10px]">to</span>
                  <span>{formatTime(entry.endTime)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{entry.subject}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {entry.room}, {entry.building}
                  </p>
                  {entry.teacher && (
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.teacher}</p>
                  )}
                </div>
                <button
                  onClick={() => remove(entry.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
