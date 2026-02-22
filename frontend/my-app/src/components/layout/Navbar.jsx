// src/components/layout/Navbar.jsx
import React from 'react';
import { MdNotifications, MdAccountCircle } from 'react-icons/md';

export default function Navbar() {
  const username = localStorage.getItem('username') || 'User';

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome back!  👋</h2>
        <p className="text-sm text-gray-600">{username}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          <MdAccountCircle className="w-8 h-8 text-gray-600" />
          <span className="text-sm font-medium">{username}</span>
        </div>
      </div>
    </div>
  );
}