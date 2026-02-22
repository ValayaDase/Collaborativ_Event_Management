// src/components/layout/Layout. jsx
import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Navbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}