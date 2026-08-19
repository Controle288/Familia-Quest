import React from 'react';
import { Clock } from 'lucide-react';
import { Task } from '../types';

const formatDue = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const DueBadge: React.FC<{ task: Task }> = ({ task }) => {
  if (!task.due_time) return null;
  const due = new Date(task.due_time);
  const overdue = due.getTime() < Date.now() && task.status !== 'completed';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
        overdue ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-[#3525cd]'
      }`}
      title={task.recurrence && task.recurrence !== 'none' ? `Repete: ${task.recurrence}` : undefined}
    >
      <Clock className="w-3 h-3" />
      {formatDue(task.due_time)}
      {task.recurrence && task.recurrence !== 'none' && ' ↻'}
    </span>
  );
};
