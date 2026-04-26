import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import axios from 'axios';
import {
  MdCalendarMonth,
  MdNorthEast,
  MdOutlineSchedule,
  MdTaskAlt,
  MdWarningAmber
} from 'react-icons/md';
import { toast } from 'react-toastify';
import Layout from '../components/layout/Layout';
import { API_URL } from '../config/api';

const summaryCardStyles = [
  { tone: 'bg-slate-900 text-white', icon: MdCalendarMonth, key: 'total' },
  { tone: 'bg-amber-50 text-amber-700 border border-amber-200', icon: MdWarningAmber, key: 'deadlines' },
  { tone: 'bg-red-50 text-red-700 border border-red-200', icon: MdWarningAmber, key: 'conflicts' },
  { tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: MdTaskAlt, key: 'tasks' }
];

const buildCalendarClassNames = (eventInfo) => {
  const classes = ['eventhub-calendar-event'];
  const { kind, conflict, warning, nearDeadline } = eventInfo.event.extendedProps;

  if (kind === 'event-deadline') classes.push('eventhub-calendar-deadline');
  if (kind === 'task') classes.push('eventhub-calendar-task');
  if (conflict || warning) classes.push('eventhub-calendar-conflict');
  if (nearDeadline) classes.push('eventhub-calendar-near');

  return classes;
};

function CalendarEventContent({ event }) {
  const { kind, conflict, nearDeadline, eventName, status } = event.extendedProps;

  return (
    <div className="w-full min-w-0">
      <div className="flex items-start gap-2">
        {(conflict || nearDeadline) ? (
          <MdWarningAmber className="text-sm mt-0.5 flex-shrink-0" />
        ) : (
          <MdTaskAlt className="text-sm mt-0.5 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-bold truncate">
            {kind === 'event-deadline' ? event.title : event.title}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-80 truncate">
            {kind === 'event-deadline' ? eventName : status?.replace('-', ' ')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [conflicts, setConflicts] = useState({ sameDayConflicts: [], overloadedUsers: [] });
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCalendar = async () => {
    try {
      const res = await axios.get(`${API_URL}/event/calendar/feed`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        setItems(res.data.items || []);
        setConflicts(res.data.conflicts || { sameDayConflicts: [], overloadedUsers: [] });
        setUnscheduledTasks(res.data.unscheduledTasks || []);
      }
    } catch (error) {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const deadlineCount = items.filter((item) => item.extendedProps.kind === 'event-deadline').length;
  const conflictCount = conflicts.sameDayConflicts.length + conflicts.overloadedUsers.length;
  const taskCount = items.filter((item) => item.extendedProps.kind === 'task').length;
  const summaryValues = {
    total: items.length,
    deadlines: deadlineCount,
    conflicts: conflictCount,
    tasks: taskCount
  };

  return (
    <Layout>
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Calendar View</p>
        <h1 className="text-3xl font-black text-slate-900 mt-2">Workload & Deadline Calendar</h1>
        <p className="text-slate-500 mt-2">
          Your event deadlines plus only your active tasks, with conflict and pressure signals layered in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {summaryCardStyles.map(({ tone, icon: Icon, key }) => (
          <div key={key} className={`rounded-[1.75rem] p-5 shadow-sm ${tone}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-black uppercase tracking-[0.22em] ${key === 'total' ? 'text-slate-300' : ''}`}>
                  {key === 'total'
                    ? 'Scheduled Items'
                    : key === 'deadlines'
                      ? 'Deadlines'
                      : key === 'conflicts'
                        ? 'Conflicts'
                        : 'Active Tasks'}
                </p>
                <p className="text-3xl font-black mt-3">{summaryValues[key]}</p>
              </div>
              <div className={`p-3 rounded-2xl ${key === 'total' ? 'bg-white/10' : 'bg-white/80'}`}>
                <Icon className="text-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-row space-x-6 mb-6">
          <div className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Conflict Detector</p>
                <h2 className="text-2xl font-black text-slate-900 mt-2">Calendar Alerts</h2>
              </div>
              <MdWarningAmber className="text-2xl text-red-500" />
            </div>

            <div className="space-y-3">
              {conflicts.sameDayConflicts.slice(0, 4).map((conflict) => (
                <div key={`${conflict.userId}-${conflict.dateKey}`} className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700">{conflict.username}</p>
                  <p className="text-sm text-red-600 mt-1">
                    {conflict.taskCount} tasks on {conflict.dateKey}
                  </p>
                </div>
              ))}

              {conflicts.overloadedUsers.slice(0, 2).map((conflict) => (
                <div key={conflict.userId} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-700">{conflict.username}</p>
                  <p className="text-sm text-amber-600 mt-1">
                    {conflict.taskCount} active assignments
                  </p>
                </div>
              ))}

              {conflicts.sameDayConflicts.length === 0 && conflicts.overloadedUsers.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-700">No conflicts</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Your current calendar load looks balanced.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Needs Scheduling</p>
                <h2 className="text-2xl font-black text-slate-900 mt-2">Unscheduled Tasks</h2>
              </div>
              <MdOutlineSchedule className="text-2xl text-slate-500" />
            </div>

            <div className="space-y-3">
              {unscheduledTasks.length > 0 ? (
                unscheduledTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.taskId}
                    type="button"
                    onClick={() => navigate(`/event/${task.eventId}`)}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-slate-300 transition"
                  >
                    <p className="font-bold text-slate-800">{task.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{task.eventName}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-700">Everything is scheduled</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    All active tasks currently have a date source.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-950 rounded-[2rem] text-white p-6 md:px-8 mb-6 shadow-md">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Legend</p>
          <div className="flex flex-wrap items-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-200" />
              <span className="text-sm font-medium text-slate-200">Active task</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-300" />
              <span className="text-sm font-medium text-slate-200">Deadline near</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-sm font-medium text-slate-200">Conflict or overload</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-6 md:mt-0 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95"
        >
          Open Dashboard
          <MdNorthEast className="text-base" />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-12">
          <div className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm p-4 md:p-6">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              events={items}
              height="auto"
              dayMaxEvents={3}
              eventClassNames={buildCalendarClassNames}
              eventContent={(eventInfo) => <CalendarEventContent event={eventInfo.event} />}
              eventClick={(eventInfo) => {
                navigate(`/event/${eventInfo.event.extendedProps.eventId}`);
              }}
            />
          </div>
        </div>

        
      </div>
    </Layout>
  );
}
