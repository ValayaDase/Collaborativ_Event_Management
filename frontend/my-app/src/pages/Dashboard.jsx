// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdEvent, MdPeople, MdCheckCircle, MdAdd, MdLogin, MdTrendingUp } from 'react-icons/md';
import { API_URL } from '../config/api';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import EventCard from '../components/dashboard/EventCard';

export default function Dashboard() {
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [memberEvents, setMemberEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdEventCode, setCreatedEventCode] = useState('');

  const loadEvents = async () => {

    try {
      const res = await axios.get(`${API_URL}/event/user-events`, {
        headers: { Authorization:  `Bearer ${localStorage.getItem('token')}` }
      });


      if (res.data.success) {
        setOrganizerEvents(res.data.organizerEvents || []);
        setMemberEvents(res.data.memberEvents || []);
      }
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const totalEvents = organizerEvents.length + memberEvents.length;
  const totalMembers = organizerEvents.reduce((sum, e) => sum + (e.members?.length || 0), 0);
  const allTasks = [... organizerEvents, ...memberEvents]. flatMap(e => e.tasks || []);
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;

  const createEvent = async () => {
    if (!eventName.trim()) {
      toast.error('Event name is required! ');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/event/create`,
        { eventName },
        { headers: { Authorization:  `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success) {
        toast.success('Event created! ');
        setCreatedEventCode(res.data. eventCode);
        setEventName('');
        loadEvents();
      } else {
        toast.error(res.data.error);

      }
    } catch (error) {
      toast.error('Failed to create event');
    }
  };


  // DELETE EVENT
  const deleteEvent = async (eventId) => {
    const res = await axios.delete(`${API_URL}/event/${eventId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.data.success) {
      toast.success("Event deleted successfully!");
      loadEvents();
    } else {
      toast.error(res.data.error);
    }
  };

  // JOIN EVENT
  const joinEvent = async () => {
    const res = await axios.post(
      `${API_URL}/event/join`,
      { eventCode: joinCode },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (res.data.message) {
      toast.success(res.data.message);
    } else {
      toast.error(res.data.error);
    }

    try {
      const res = await axios.post(
        `${API_URL}/event/join`,
        { eventCode: joinCode.toUpperCase() },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (res.data.success || res.data.message) {
        toast.success(res.data.message || 'Joined successfully!');
        setShowJoinModal(false);
        setJoinCode('');
        loadEvents();
      } else {
        toast.error(res.data.error);
      }
    } catch (error) {
      toast.error('Failed to join event');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdEventCode);
    toast.success('Code copied! ');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Stats */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Events"
          value={totalEvents}
          icon={MdEvent}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Team Members"
          value={totalMembers}
          icon={MdPeople}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Completed Tasks"
          value={completedTasks}
          icon={MdCheckCircle}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Total Tasks"
          value={allTasks.length}
          icon={MdTrendingUp}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          <MdAdd className="w-5 h-5" />
          Create Event
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition border border-gray-300"
        >
          <MdLogin className="w-5 h-5" />
          Join Event
        </button>
      </div>

      {/* Events */}
      {organizerEvents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <MdEvent className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No created events yet</h3>
          <p className="text-gray-600">Create an event to get started</p>
        </div>
      ) : (
        <div className="space-y-8">
          {organizerEvents. length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">My Created Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizerEvents.map((event) => (
                  <EventCard key={event._id} event={event} isOrganizer={true} />
                ))}
              </div>
            </div>
          )}

          {/* {memberEvents.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Joined Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memberEvents.map((event) => (
                  <EventCard key={event._id} event={event} isOrganizer={false} />
                ))}
              </div>
            </div>
          )} */}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            {! createdEventCode ? (
              <>
                <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
                <input
                  type="text"
                  placeholder="Enter event name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createEvent()}
                />
                <div className="flex gap-3">
                  <button
                    onClick={createEvent}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedEventCode('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
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
                <h2 className="text-2xl font-bold mb-2">Event Created!</h2>
                <p className="text-gray-600 mb-6">Share this code with team members</p>
                <div className="bg-gray-100 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Event Code</p>
                  <p className="text-3xl font-bold text-blue-600">{createdEventCode}</p>
                  <button
                    onClick={copyCode}
                    className="mt-4 px-4 py-2 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50"
                  >
                    📋 Copy Code
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedEventCode('');
                  }}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Join Event</h2>
            <input
              type="text"
              placeholder="Enter event code..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none uppercase text-center font-bold"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target. value. toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && joinEvent()}
              maxLength={6}
            />
            <div className="flex gap-3">
              <button
                onClick={joinEvent}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Join
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}