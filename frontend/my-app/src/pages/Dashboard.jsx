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
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your events</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={logout}
          >
            <IoLogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition flex items-center gap-4"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="p-3 bg-blue-500 text-white rounded-lg">
              <MdAdd className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-800">Create Event</h2>
              <p className="text-sm text-gray-600">Start a new event</p>
            </div>
          </button>

          <button
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition flex items-center gap-4"
            onClick={() => setShowJoinModal(true)}
          >
            <div className="p-3 bg-green-500 text-white rounded-lg">
              <MdLogin className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-800">Join Event</h2>
              <p className="text-sm text-gray-600">Enter event code</p>
            </div>
          </button>
        </div>

        {/* Created Events */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MdEvent className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Your Created Events</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              {organizerEvents.length}
            </span>
          </div>

          {organizerEvents.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No events created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizerEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden group"
                  onClick={() => navigate(`/event/${ev._id}`)}
                >
                  <div className="h-2 bg-blue-500"></div>
                  <div className="p-5 relative">
                    <button
                      className="absolute top-3 right-3 p-2 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEvent(ev._id);
                      }}
                    >
                      <MdDelete size={18} />
                    </button>

                    <h3 className="text-lg font-bold text-gray-800 mb-3 pr-8">{ev.eventName}</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Organizer
                      </span>
                      {ev.isFinished && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
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

        {/* Joined Events */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MdGroup className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Events You Joined</h2>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              {memberEvents.length}
            </span>
          </div>

          {memberEvents.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No joined events yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/event/${ev._id}`)}
                >
                  <div className="h-2 bg-green-500"></div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">{ev.eventName}</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Member
                      </span>
                      {ev.isFinished && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Event</h2>

            <input
              type="text"
              placeholder="Enter event name"
              className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                onClick={createEvent}
              >
                Create
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Join Event</h2>

            <input
              type="text"
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border rounded-lg mb-4 text-center text-xl font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
            />

            <div className="flex gap-3">
              <button
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                onClick={joinEvent}
              >
                Join
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                onClick={() => setShowJoinModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Code Modal */}
      {createdEventCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdEvent className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Created!</h2>
            <p className="text-gray-600 mb-6">Share this code with your team</p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-xs text-gray-600 mb-2">EVENT CODE</p>
              <div className="text-4xl font-bold text-blue-600 tracking-widest">
                {createdEventCode}
              </div>
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 mb-3"
              onClick={() => {
                navigator.clipboard.writeText(createdEventCode);
                toast.info("Code copied!");
              }}
            >
              <MdContentCopy className="w-5 h-5" />
              Copy Code
            </button>

            <button
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
              onClick={() => setCreatedEventCode("")}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
