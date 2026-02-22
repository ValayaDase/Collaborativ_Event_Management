// src/components/events/KanbanColumn.jsx
import React from 'react';
import { MdCheckCircle, MdAccessTime, MdList } from 'react-icons/md';
import TaskCard from './TaskCard';

const statusConfig = {
  'todo': {
    label: 'To Do',
    icon: MdList,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    headerBg: 'bg-gray-100',
    textColor: 'text-gray-700',
    iconColor: 'text-gray-600'
  },
  'in-progress': {
    label: 'In Progress',
    icon: MdAccessTime,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    headerBg: 'bg-blue-100',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600'
  },
  'completed': {
    label: 'Completed',
    icon: MdCheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    headerBg: 'bg-green-100',
    textColor: 'text-green-700',
    iconColor: 'text-green-600'
  }
};

export default function KanbanColumn({ status, tasks, totalTasks, currentUserId, isOrganizer, isFinished, deleteTask, updateStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const statusTasks = tasks.filter(t => t.status === status);
  const progress = totalTasks > 0 ? Math.round((statusTasks.length / totalTasks) * 100) : 0;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg overflow-hidden shadow-md`}>
      <div className={`${config.headerBg} px-4 py-3 border-b ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={20} className={config.iconColor} />
            <h3 className={`font-semibold ${config.textColor}`}>{config.label}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${config.textColor}`}>
              {statusTasks.length}
            </span>
            <span className={`text-xs ${config.textColor} opacity-70`}>
              ({progress}%)
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3 min-h-[200px]">
        {statusTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No tasks yet</p>
          </div>
        ) : (
          statusTasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              isFinished={isFinished}
              status={status}
              deleteTask={deleteTask}
              updateStatus={updateStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}
