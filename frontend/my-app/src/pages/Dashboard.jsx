import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  MdAdd,
  MdCheckCircle,
  MdEvent,
  MdLogin,
  MdPeople,
  MdWarningAmber
} from 'react-icons/md';
import { API_URL } from '../config/api';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import EventCard from '../components/dashboard/EventCard';
import PressureMeter from '../components/dashboard/PressureMeter';
import WarningBanner from '../components/dashboard/WarningBanner';
import EventHealthPanel from '../components/dashboard/EventHealthPanel';

export default function Dashboard() {
  const navigate = useNavigate();
  const warnedSilentFailure = useRef(false);

  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [memberEvents, setMemberEvents] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDeadline, setEventDeadline] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdEventCode, setCreatedEventCode] = useState('');

  const loadEvents = async () => {
    const res = await axios.get(`${API_URL}/event/user-events`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.data.success) {
      setOrganizerEvents(res.data.organizerEvents || []);
      setMemberEvents(res.data.memberEvents || []);
    }
  };

  const loadOverview = async () => {
    const res = await axios.get(`${API_URL}/event/dashboard/overview`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.data.success) {
      setOverview(res.data);
    }
  };

  const loadDashboard = async () => {
    try {
      await Promise.all([loadEvents(), loadOverview()]);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const silentFailures = overview?.summary?.silentFailures || 0;
    if (silentFailures > 0 && !warnedSilentFailure.current) {
      toast.warn('No progress detected in one or more events');
      warnedSilentFailure.current = true;
    }
  }, [overview]);

  const totalEvents = organizerEvents.length + memberEvents.length;
  const totalMembers = organizerEvents.reduce((sum, event) => sum + (event.members?.length || 0), 0);
  const allTasks = [...organizerEvents, ...memberEvents].flatMap((event) => event.tasks || []);
  const completedTasks = allTasks.filter((task) => task.status === 'completed').length;

  const createEvent = async () => {
    if (!eventName.trim()) {
      toast.error('Event name is required');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/event/create`,
        { eventName, deadline: eventDeadline || undefined },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        toast.success('Event created');
        setCreatedEventCode(res.data.eventCode);
        setEventName('');
        setEventDeadline('');
        await loadDashboard();
      } else {
        toast.error(res.data.error);
      }
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const joinEvent = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/event/join`,
        { eventCode: joinCode.toUpperCase() },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        toast.success(res.data.message || 'Joined successfully');
        setShowJoinModal(false);
        setJoinCode('');
        await loadDashboard();
      } else {
        toast.error(res.data.error || 'Failed to join event');
      }
    } catch (error) {
      toast.error('Failed to join event');
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(createdEventCode);
    toast.success('Code copied');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const alerts = overview?.alerts || [];
  const eventHealth = overview?.eventHealth || [];
  const conflicts = overview?.conflicts || { sameDayConflicts: [], overloadedUsers: [] };
  const highestPressure = overview?.summary?.highestPressure || null;
  const firstConflict = conflicts.sameDayConflicts[0];
  const firstOverload = conflicts.overloadedUsers[0];

  return (
    <Layout>
      <div className="space-y-6 mb-8">
        {overview?.summary?.silentFailures > 0 ? (
          <WarningBanner
            title="No progress detected"
            message={`${overview.summary.silentFailures} event${overview.summary.silentFailures === 1 ? '' : 's'} have gone quiet for too long. Reach out before momentum drops further.`}
            tone="critical"
          />
        ) : null}

        {(firstConflict || firstOverload) ? (
          <WarningBanner
            title="Conflict Detector"
            message={
              firstConflict
                ? `${firstConflict.username} has ${firstConflict.taskCount} active tasks on ${firstConflict.dateKey}.`
                : `${firstOverload.username} is carrying ${firstOverload.taskCount} active tasks right now.`
            }
            tone="warning"
            icon={MdWarningAmber}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Events"
          value={totalEvents}
          icon={MdEvent}
          bgColor="bg-slate-100"
          iconColor="text-slate-800"
        />
        <StatsCard
          title="Team Members"
          value={totalMembers}
          icon={MdPeople}
          bgColor="bg-slate-100"
          iconColor="text-slate-800"
        />
        <StatsCard
          title="Completed Tasks"
          value={completedTasks}
          icon={MdCheckCircle}
          bgColor="bg-black"
          iconColor="text-white"
        />
        <StatsCard
          title="Active Tasks"
          value={overview?.summary?.pendingTasks || 0}
          icon={MdWarningAmber}
          bgColor="bg-amber-100"
          iconColor="text-amber-700"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        <div className="xl:col-span-8">
          <EventHealthPanel
            eventHealth={eventHealth}
            alerts={alerts}
            onOpenEvent={(eventId) => navigate(`/event/${eventId}`)}
          />
        </div>
        <div className="xl:col-span-4 space-y-6">
          <PressureMeter
            title="Pressure Level"
            pressure={highestPressure?.pressure || { label: 'No deadline', level: 'unknown', value: null, daysLeft: null }}
            subtitle={
              highestPressure
                ? `${highestPressure.eventName} has the highest load right now.`
                : 'Add deadlines to events so pressure can be tracked.'
            }
          />

          {/* <div className="bg-white rounded-[2rem] border border-slate-200/70 shadow-sm p-6 overflow-hidden">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Conflict Detector</p>
            <h3 className="text-2xl font-black text-slate-900 mt-2">
              {conflicts.sameDayConflicts.length + conflicts.overloadedUsers.length}
            </h3>
            <p className="text-sm text-slate-500 mt-2 break-words">
              Same-day task overlaps and overloaded assignees across your active events.
            </p>

            <div className="space-y-3 mt-5">
              {firstConflict ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-700">Same-day overlap</p>
                  <p className="text-sm text-red-600 mt-1 break-words">
                    {firstConflict.username} has {firstConflict.taskCount} tasks on {firstConflict.dateKey}.
                  </p>
                </div>
              ) : null}

              {firstOverload ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-700">Heavy assignment load</p>
                  <p className="text-sm text-amber-600 mt-1 break-words">
                    {firstOverload.username} is carrying {firstOverload.taskCount} active tasks.
                  </p>
                </div>
              ) : null}

              {!firstConflict && !firstOverload ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-700">No conflicts right now</p>
                  <p className="text-sm text-emerald-600 mt-1 break-words">
                    The current workload looks balanced.
                  </p>
                </div>
              ) : null}
            </div>
          </div> */}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-medium hover:bg-slate-800 transition active:scale-[0.98] cursor-pointer"
        >
          <MdAdd className="w-5 h-5" />
          Create Event
        </button>
        <button
          type="button"
          onClick={() => setShowJoinModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-800 rounded-2xl font-medium hover:bg-slate-50 transition border border-slate-300 active:scale-[0.98] cursor-pointer"
        >
          <MdLogin className="w-5 h-5" />
          Join Event
        </button>
      </div>

      <div className="space-y-8">
        {organizerEvents.length > 0 ? (
          <div>
            <h3 className="text-xl font-black text-gray-800 mb-4">My Created Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizerEvents.map((event) => (
                <EventCard key={event._id} event={event} isOrganizer />
              ))}
            </div>
          </div>
        ) : null}

        {memberEvents.length > 0 ? (
          <div>
            <h3 className="text-xl font-black text-gray-800 mb-4">Joined Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memberEvents.map((event) => (
                <EventCard key={event._id} event={event} isOrganizer={false} />
              ))}
            </div>
          </div>
        ) : null}

        {organizerEvents.length === 0 && memberEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-300">
            <MdEvent className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-gray-800 mb-2">No events yet</h3>
            <p className="text-gray-600">Create or join an event to get started</p>
          </div>
        ) : null}
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            {!createdEventCode ? (
              <>
                <h2 className="text-2xl font-black mb-6 text-slate-900">Create New Event</h2>
                <input
                  type="text"
                  placeholder="Enter event name..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4 focus:ring-1 focus:ring-black focus:border-black outline-none transition"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createEvent()}
                />
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-6 focus:ring-1 focus:ring-black focus:border-black outline-none transition text-slate-700"
                  value={eventDeadline}
                  onChange={(e) => setEventDeadline(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createEvent()}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={createEvent}
                    className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition active:scale-[0.98]"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedEventCode('');
                      setEventName('');
                      setEventDeadline('');
                    }}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdCheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-slate-900">Event Created</h2>
                <p className="text-slate-600 mb-6">Share this code with team members</p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                  <p className="text-sm text-slate-600 mb-2 uppercase tracking-widest font-semibold">Event Code</p>
                  <p className="text-3xl font-black text-black tracking-widest">{createdEventCode}</p>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 transition"
                  >
                    Copy Code
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedEventCode('');
                  }}
                  className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {showJoinModal ? (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6 text-slate-900">Join Event</h2>
            <input
              type="text"
              placeholder="Enter event code..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-6 focus:ring-1 focus:ring-black focus:border-black outline-none uppercase text-center font-bold tracking-widest transition"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinEvent()}
              maxLength={6}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={joinEvent}
                className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition active:scale-[0.98]"
              >
                Join
              </button>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
