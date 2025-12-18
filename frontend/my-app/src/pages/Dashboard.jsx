import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdAdd, MdLogin, MdEvent, MdGroup, MdContentCopy } from "react-icons/md";
import { IoLogOut } from "react-icons/io5";
import { toast } from "react-toastify";

export default function Dashboard() {
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [eventName, setEventName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createdEventCode, setCreatedEventCode] = useState("");

  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [memberEvents, setMemberEvents] = useState([]);

  // LOAD EVENTS FOR USER
  const loadEvents = async () => {
    const res = await axios.get("http://localhost:5000/event/user-events", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (res.data.success) {
      setOrganizerEvents(res.data.organizerEvents);
      setMemberEvents(res.data.memberEvents);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // CREATE EVENT
  const createEvent = async () => {
    const res = await axios.post(
      "http://localhost:5000/event/create",
      { eventName },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (res.data.success) {
      setShowCreateModal(false);
      setEventName("");

      // show event code modal
      setCreatedEventCode(res.data.eventCode);
      toast.success("Event created successfully!");

      loadEvents();
    } else {
      toast.error(res.data.error);
    }
  };

  // DELETE EVENT
  const deleteEvent = async (eventId) => {
    const res = await axios.delete(`http://localhost:5000/event/${eventId}`, {
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
      "http://localhost:5000/event/join",
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

    setShowJoinModal(false);
    setJoinCode("");
    loadEvents();
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your events and collaborations</p>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
            onClick={logout}
          >
            <IoLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 border border-gray-100"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="flex items-start gap-4">
              <div className="p-4 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl">
                <MdAdd className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Event</h2>
                <p className="text-gray-600">
                  Start a new event and invite your team with a shareable code
                </p>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 border border-gray-100"
            onClick={() => setShowJoinModal(true)}
          >
            <div className="flex items-start gap-4">
              <div className="p-4 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl">
                <MdLogin className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Event</h2>
                <p className="text-gray-600">
                  Enter an event code to join and collaborate with others
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizer Events */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <MdEvent className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Your Created Events</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {organizerEvents.length}
            </span>
          </div>

          {organizerEvents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No events created yet. Create your first event to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {organizerEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 overflow-hidden group relative"
                  onClick={() => navigate(`/event/${ev._id}`)}
                >
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEvent(ev._id);
                      }}
                      title="Delete Event"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>

                  <div className="h-3 bg-linear-to-r from-blue-500 to-purple-600"></div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 pr-8">{ev.eventName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        Organizer
                      </span>
                      {ev.isFinished && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          Finished
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Events */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <MdGroup className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-800">Events You Joined</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {memberEvents.length}
            </span>
          </div>

          {memberEvents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No joined events yet. Use an event code to join a team!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {memberEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 overflow-hidden"
                  onClick={() => navigate(`/event/${ev._id}`)}
                >
                  <div className="h-3 bg-linear-to-r from-green-500 to-emerald-600"></div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{ev.eventName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Member
                      </span>
                      {ev.isFinished && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          Finished
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Event</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  placeholder="Enter event name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                  onClick={createEvent}
                >
                  Create Event
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JOIN EVENT MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Join Event</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Code
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit event code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition uppercase tracking-widest text-center text-xl font-bold"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-linear-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
                  onClick={joinEvent}
                >
                  Join Event
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVENT CODE MODAL (AFTER CREATION) */}
      {createdEventCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-linear-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdEvent className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Created!</h2>
              <p className="text-gray-600">Share this code with your team members</p>
            </div>

            <div className="bg-linear-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Event Code</p>
              <div className="text-4xl font-bold text-blue-600 tracking-widest">
                {createdEventCode}
              </div>
            </div>

            <div className="space-y-3">
              <button
                className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                onClick={() => {
                  navigator.clipboard.writeText(createdEventCode);
                  toast.info("Code copied!");
                }}
              >
                <MdContentCopy className="w-5 h-5" />
                Copy Code
              </button>

              <button
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                onClick={() => setCreatedEventCode("")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
