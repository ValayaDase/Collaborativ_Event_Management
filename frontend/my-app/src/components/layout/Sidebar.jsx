// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdEvent, MdLogout, MdMenu, MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
    { path: '/events', label: 'All Events', icon: MdEvent }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      toast.success('Logged out! ');
      navigate('/login');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg"
      >
        {isOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
      </button>

      <div className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white w-64 transform transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">EventHub</h1>
          <p className="text-sm text-slate-400">Manage Events</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ?  'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition"
          >
            <MdLogout className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" />
      )}
    </>
  );
}