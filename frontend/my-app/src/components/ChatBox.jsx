// src/components/ChatBox.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import { IoSend, IoChatbubblesOutline } from "react-icons/io5";

export default function ChatBox({ eventId, socket, isOpen, isFinished }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");

  // 1. Load initial messages
  useEffect(() => {
    if (!eventId) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/chat/${eventId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [eventId]);

  // 2. Handle Real-time Socket Connection safely
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("new-message", handleNewMessage);

    // Cleanup prevents duplicate messages firing in React Strict Mode
    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket]);

  // 3. Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || isFinished) return;

    // Optimistic UI update could go here, but waiting for DB ensures sync
    try {
      const res = await axios.post(
        `${API_URL}/chat/${eventId}`,
        { text: newMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data.success) {
        setNewMessage(""); // Clear input on success
      } else {
        alert(res.data.error);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      
      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-slate-400 opacity-60">
            <IoChatbubblesOutline className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium text-center">
              No messages yet.<br />Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender._id === currentUserId;

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
              >
                {!isOwnMessage && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
                    {msg.sender.username}
                  </span>
                )}
                
                <div
                  className={`max-w-[85%] px-4 py-2.5 shadow-sm text-sm break-words whitespace-pre-wrap ${
                    isOwnMessage
                      ? "bg-slate-900 text-white rounded-2xl rounded-tr-sm" // Organizer/Own bubble
                      : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm" // Other bubble
                  }`}
                >
                  {msg.text}
                </div>
                
                <span className="text-[10px] font-semibold text-slate-400 mt-1 mx-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-slate-100">
        {isFinished ? (
          <div className="text-center p-3 bg-slate-50 text-slate-500 rounded-2xl text-sm font-medium border border-slate-200">
            This event has ended. Chat is read-only.
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              maxLength={500}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
            />
            <button
              type="submit"
              disabled={newMessage.trim() === ""}
              className="bg-slate-900 text-white p-3 px-4 rounded-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-slate-200"
            >
              <IoSend className="w-5 h-5 ml-1" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}