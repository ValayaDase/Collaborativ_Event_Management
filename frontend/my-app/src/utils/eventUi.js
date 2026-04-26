export const formatDateLabel = (value, options = {}) => {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options
  }).format(date);
};

export const formatDateTimeLabel = (value) => {
  if (!value) return "No activity yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

export const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

export const daysLeftFromDeadline = (value) => {
  if (!value) return null;

  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return null;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDeadline = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate()
  );

  return Math.ceil((startOfDeadline.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
};

export const getDeadlineTone = (daysLeft) => {
  if (daysLeft === null) return "slate";
  if (daysLeft < 0) return "red";
  if (daysLeft <= 5) return "amber";
  return "emerald";
};

export const getPressureStyles = (level) => {
  switch (level) {
    case "high":
      return {
        badge: "bg-red-100 text-red-700 border-red-200",
        bar: "from-red-500 to-orange-500",
        track: "bg-red-100"
      };
    case "medium":
      return {
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        bar: "from-amber-400 to-orange-400",
        track: "bg-amber-100"
      };
    case "low":
      return {
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        bar: "from-emerald-500 to-teal-500",
        track: "bg-emerald-100"
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-600 border-slate-200",
        bar: "from-slate-400 to-slate-500",
        track: "bg-slate-100"
      };
  }
};

export const getHealthAccent = (status) => {
  switch (status) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
};

export const getTaskEffectiveDate = (task, eventDeadline) => task?.dueDate || eventDeadline || null;
