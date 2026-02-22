// src/components/dashboard/StatsCard.jsx
import React from 'react';

export default function StatsCard({ title, value, icon: Icon, bgColor, iconColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}