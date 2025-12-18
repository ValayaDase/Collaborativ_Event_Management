import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import useSocket from "../hooks/useSocket";
import { IoSend, IoChatbubblesOutline } from "react-icons/io5";

export default function ChatBox({ eventId, isOpen, isFinished }) {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");

  // ... (keep all your useEffect hooks the same)

  useEffect(() => {
    if (!socket || !eventId || !isOpen) return;
    socket.emit("join-event", eventId);
    console.log("ChatBox joined event:", eventId);
    return () => {};
  }, [socket, eventId, isOpen]);

  useEffect(() => {
    if (!isOpen || !eventId) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/chat/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

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
  }, [isOpen, eventId]);

  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleNewMessage = (message) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (newMessage.trim() === "") return;

    try {
      const res = await axios.post(
        `http://localhost:5000/chat/${eventId}`,
        { text: newMessage },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.success) {
        setNewMessage("");
      } else {
        alert(res.data.error);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* HEADER - FIXED */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center gap-2">
        <IoChatbubblesOutline className="w-6 h-6" />
        <h3 className="font-semibold">Group Chat</h3>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-400">
            <IoChatbubblesOutline className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-center">
              No messages yet. <br />
              Start the conversation! 👋
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender._id === currentUserId;

            return (
              <div
                key={msg._id}
                className={`mb-3 flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwnMessage
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 shadow-sm"
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-semibold text-blue-600 mb-1">
                      {msg.sender.username}
                    </div>
                  )}
                  
                  <div className="text-sm break-word whitespace-pre-wrap">
                    {msg.text}
                  </div>
                  
                  <div
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <form
        onSubmit={sendMessage}
        className="border-t border-gray-200 p-3 bg-white"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            maxLength={500}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isFinished || newMessage.trim() === ""}
          >
            <IoSend className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
