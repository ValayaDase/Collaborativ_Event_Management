const ACTIVE_TASK_STATUSES = ["todo", "in-progress"];
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toStartOfDay = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getDaysLeft = (deadline) => {
  const deadlineDate = toStartOfDay(deadline);
  if (!deadlineDate) return null;

  const today = toStartOfDay(new Date());
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / DAY_IN_MS);
};

export const isDeadlineNear = (deadline, windowDays = 5) => {
  const daysLeft = getDaysLeft(deadline);
  return daysLeft !== null && daysLeft >= 0 && daysLeft <= windowDays;
};

export const getEffectiveTaskDate = (task, eventDeadline) => {
  return task?.dueDate || eventDeadline || null;
};

export const getLastActivityAt = (event) => {
  const timestamps = (event.activities || [])
    .map((activity) => new Date(activity.timestamp))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime());

  if (timestamps.length > 0) {
    return timestamps[0];
  }

  return event.updatedAt || event.createdAt || null;
};

export const calculatePressure = (pendingTasks, deadline) => {
  const daysLeft = getDaysLeft(deadline);

  if (daysLeft === null) {
    return {
      value: null,
      daysLeft: null,
      level: "unknown",
      label: "No deadline"
    };
  }

  const safeDaysLeft = Math.max(daysLeft, 1);
  const value = Number((pendingTasks / safeDaysLeft).toFixed(2));

  let level = "low";
  let label = "Low";

  if (value >= 3) {
    level = "high";
    label = "High";
  } else if (value >= 1.5) {
    level = "medium";
    label = "Medium";
  }

  return {
    value,
    daysLeft,
    level,
    label
  };
};

export const buildEventHealth = (
  event,
  {
    activityWindowHours = 24,
    silentFailureHours = 48,
    pendingTaskThreshold = 8,
    deadlineWindowDays = 5
  } = {}
) => {
  const tasks = event.tasks || [];
  const pendingTasks = tasks.filter((task) => ACTIVE_TASK_STATUSES.includes(task.status));
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const lastActivityAt = getLastActivityAt(event);
  const hoursSinceActivity = lastActivityAt
    ? Number(((Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60)).toFixed(1))
    : null;

  const lowActivity = hoursSinceActivity !== null && hoursSinceActivity >= activityWindowHours;
  const silentFailure = hoursSinceActivity !== null && hoursSinceActivity >= silentFailureHours;
  const tooManyPendingTasks = pendingTasks.length >= pendingTaskThreshold;
  const nearDeadline = isDeadlineNear(event.deadline, deadlineWindowDays);
  const pressure = calculatePressure(pendingTasks.length, event.deadline);

  const suggestions = [];

  if (lowActivity) {
    suggestions.push("Your event is slowing down.");
  }

  if (tooManyPendingTasks) {
    suggestions.push("Too many active tasks are still waiting for completion.");
  }

  if (nearDeadline) {
    suggestions.push("Deadline is close. Prioritize high-impact tasks now.");
  }

  if (silentFailure) {
    suggestions.push("No progress detected recently. Prompt the team for an update.");
  }

  return {
    eventId: String(event._id),
    eventName: event.eventName,
    deadline: event.deadline || null,
    nearDeadline,
    lastActivityAt,
    hoursSinceActivity,
    pendingTasks: pendingTasks.length,
    completedTasks: completedTasks.length,
    lowActivity,
    tooManyPendingTasks,
    silentFailure,
    pressure,
    suggestions,
    status:
      silentFailure || pressure.level === "high"
        ? "critical"
        : lowActivity || tooManyPendingTasks || nearDeadline || pressure.level === "medium"
          ? "warning"
          : "healthy"
  };
};

export { ACTIVE_TASK_STATUSES };
