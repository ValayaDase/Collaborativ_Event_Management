// src/pages/EventsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdSearch, MdFilterList } from 'react-icons/md';
import { API_URL } from '../config/api';
import Layout from '../components/layout/Layout';
import EventCard from '../components/dashboard/EventCard';

export default function EventsPage() {
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [memberEvents, setMemberEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, created, joined
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/event/user-events`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        setOrganizerEvents(res. data.organizerEvents || []);
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

  const allEvents = [...organizerEvents. map(e => ({ ...e, isOrganizer: true })), ...memberEvents.map(e => ({ ...e, isOrganizer: false }))];

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event. eventName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'created' && event. isOrganizer) || (filter === 'joined' && !event. isOrganizer);
    return matchesSearch && matchesFilter;
  });

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">All Events</h1>
        <p className="text-gray-600">Manage and view all your events</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 mb-8 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('created')}
              className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'created' ?  'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Created
            </button>
            <button
              onClick={() => setFilter('joined')}
              className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'joined' ? 'bg-blue-600 text-white' :  'bg-gray-100 text-gray-700 hover: bg-gray-200'}`}
            >
              Joined
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-gray-600">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event._id} event={event} isOrganizer={event. isOrganizer} />
          ))}
        </div>
      )}
    </Layout>
  );
}