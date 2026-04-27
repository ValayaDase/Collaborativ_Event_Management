import crypto from "crypto";
import mongoose from "mongoose";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { Message } from "../models/Message.js";
import { getIO } from "../socket.js";
import {
  ACTIVE_TASK_STATUSES,
  buildEventHealth,
  calculatePressure,
  getEffectiveTaskDate,
  isDeadlineNear
} from "../utils/eventInsights.js";

const DEFAULT_ACTIVITY_WINDOW_HOURS = 24;
const DEFAULT_SILENT_FAILURE_HOURS = 48;
const DEFAULT_PENDING_TASK_THRESHOLD = 8;
const DEFAULT_OVERLOAD_THRESHOLD = 6;
const DEFAULT_DEADLINE_WINDOW_DAYS = 5;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const populateEventDetails = (query) =>
  query
    .populate("organizer", "username email")
    .populate("members", "username email")
    .populate("tasks.assignedTo", "username email")
    .populate("tasks.createdBy", "username email");

const loadEventWithRelations = (eventId) => populateEventDetails(Event.findById(eventId));

const sortHealth = (left, right) => {
  const priority = { critical: 0, warning: 1, healthy: 2 };
  return (
    (priority[left.status] ?? 9) - (priority[right.status] ?? 9) ||
    left.eventName.localeCompare(right.eventName)
  );
};

const buildOverviewAlerts = (healthItems, conflicts) => {
  const alerts = [];

  healthItems.forEach((health) => {
    if (health.silentFailure) {
      alerts.push({
        type: "silent-failure",
        severity: "critical",
        eventId: health.eventId,
        eventName: health.eventName,
        message: "No progress detected recently."
      });
    } else if (health.lowActivity) {
      alerts.push({
        type: "low-activity",
        severity: "warning",
        eventId: health.eventId,
        eventName: health.eventName,
        message: "Your event is slowing down."
      });
    }

    if (health.tooManyPendingTasks) {
      alerts.push({
        type: "pending-overload",
        severity: "warning",
        eventId: health.eventId,
        eventName: health.eventName,
        message: `${health.pendingTasks} active tasks are still pending.`
      });
    }

    if (health.nearDeadline) {
      alerts.push({
        type: "near-deadline",
        severity: health.pressure.level === "high" ? "critical" : "warning",
        eventId: health.eventId,
        eventName: health.eventName,
        message: "Deadline is near."
      });
    }

    if (health.pressure.level === "high") {
      alerts.push({
        type: "pressure-high",
        severity: "critical",
        eventId: health.eventId,
        eventName: health.eventName,
        message: `Pressure level is HIGH (${health.pressure.value}).`
      });
    }
  });

  conflicts.sameDayConflicts.forEach((conflict) => {
    alerts.push({
      type: "task-conflict",
      severity: "warning",
      eventId: conflict.tasks[0]?.eventId || null,
      eventName: conflict.tasks[0]?.eventName || "Task conflict",
      message: `${conflict.username} has ${conflict.taskCount} tasks on ${conflict.dateKey}.`
    });
  });

  conflicts.overloadedUsers.forEach((conflict) => {
    alerts.push({
      type: "user-overload",
      severity: "warning",
      eventId: conflict.tasks[0]?.eventId || null,
      eventName: conflict.tasks[0]?.eventName || "Heavy workload",
      message: `${conflict.username} has ${conflict.taskCount} active tasks assigned.`
    });
  });

  return alerts;
};

const getConflictSummary = async (
  userId,
  { sameDayLimit = 1, overloadThreshold = DEFAULT_OVERLOAD_THRESHOLD } = {}
) => {
  const viewerId = toObjectId(userId);

  const sameDayRaw = await Event.aggregate([
    {
      $match: {
        members: viewerId,
        isFinished: { $ne: true }
      }
    },
    { $unwind: "$tasks" },
    { $unwind: { path: "$tasks.assignedTo", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        effectiveDueDate: { $ifNull: ["$tasks.dueDate", "$deadline"] }
      }
    },
    {
      $match: {
        "tasks.assignedTo": { $ne: null },
        "tasks.status": { $in: ACTIVE_TASK_STATUSES },
        effectiveDueDate: { $ne: null }
      }
    },
    {
      $group: {
        _id: {
          userId: "$tasks.assignedTo",
          dateKey: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$effectiveDueDate"
            }
          }
        },
        taskCount: { $sum: 1 },
        tasks: {
          $push: {
            taskId: "$tasks._id",
            title: "$tasks.title",
            status: "$tasks.status",
            eventId: "$_id",
            eventName: "$eventName",
            dueDate: "$effectiveDueDate"
          }
        }
      }
    },
    {
      $match: {
        taskCount: { $gt: sameDayLimit }
      }
    },
    {
      $sort: {
        "_id.dateKey": 1,
        taskCount: -1
      }
    }
  ]);

  const overloadedRaw = await Event.aggregate([
    {
      $match: {
        members: viewerId,
        isFinished: { $ne: true }
      }
    },
    { $unwind: "$tasks" },
    { $unwind: { path: "$tasks.assignedTo", preserveNullAndEmptyArrays: true } },
    {
      $match: {
        "tasks.assignedTo": { $ne: null },
        "tasks.status": { $in: ACTIVE_TASK_STATUSES }
      }
    },
    {
      $group: {
        _id: "$tasks.assignedTo",
        taskCount: { $sum: 1 },
        tasks: {
          $push: {
            taskId: "$tasks._id",
            title: "$tasks.title",
            status: "$tasks.status",
            dueDate: { $ifNull: ["$tasks.dueDate", "$deadline"] },
            eventId: "$_id",
            eventName: "$eventName"
          }
        }
      }
    },
    {
      $match: {
        taskCount: { $gte: overloadThreshold }
      }
    },
    {
      $sort: {
        taskCount: -1
      }
    }
  ]);

  const userIds = [
    ...new Set([
      ...sameDayRaw.map((item) => String(item._id.userId)),
      ...overloadedRaw.map((item) => String(item._id))
    ])
  ];

  const users = await User.find({ _id: { $in: userIds } }).select("username email");
  const userMap = new Map(users.map((user) => [String(user._id), user]));

  const sameDayConflicts = sameDayRaw.map((item) => ({
    userId: String(item._id.userId),
    username: userMap.get(String(item._id.userId))?.username || "Unknown user",
    dateKey: item._id.dateKey,
    taskCount: item.taskCount,
    tasks: item.tasks.map((task) => ({
      ...task,
      taskId: String(task.taskId),
      eventId: String(task.eventId)
    }))
  }));

  const overloadedUsers = overloadedRaw.map((item) => ({
    userId: String(item._id),
    username: userMap.get(String(item._id))?.username || "Unknown user",
    taskCount: item.taskCount,
    tasks: item.tasks.map((task) => ({
      ...task,
      taskId: String(task.taskId),
      eventId: String(task.eventId)
    }))
  }));

  const currentUserConflictTaskIds = [
    ...new Set([
      ...sameDayConflicts
        .filter((conflict) => conflict.userId === userId)
        .flatMap((conflict) => conflict.tasks.map((task) => task.taskId)),
      ...(overloadedUsers.find((conflict) => conflict.userId === userId)?.tasks || []).map(
        (task) => task.taskId
      )
    ])
  ];

  return {
    sameDayConflicts,
    overloadedUsers,
    currentUserConflictTaskIds
  };
};

export const createEvent = async (req, res) => {
  try {
    const { eventName, deadline } = req.body;
    const userId = req.userId;

    const eventCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const event = await Event.create({
      eventName,
      eventCode,
      deadline: deadline ? new Date(deadline) : null,
      organizer: userId,
      members: [userId]
    });

    await User.findByIdAndUpdate(userId, {
      $push: { createdEvents: event._id, joinedEvents: event._id }
    });

    return res.json({
      success: true,
      message: "Event created successfully",
      eventCode,
      event
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
};

export const getDashboardOverview = async (req, res) => {
  try {
    const activityWindowHours = parsePositiveInt(
      req.query.activityWindowHours,
      DEFAULT_ACTIVITY_WINDOW_HOURS
    );
    const silentFailureHours = parsePositiveInt(
      req.query.silentFailureHours,
      DEFAULT_SILENT_FAILURE_HOURS
    );
    const pendingTaskThreshold = parsePositiveInt(
      req.query.pendingTaskThreshold,
      DEFAULT_PENDING_TASK_THRESHOLD
    );
    const overloadThreshold = parsePositiveInt(
      req.query.overloadThreshold,
      DEFAULT_OVERLOAD_THRESHOLD
    );

    const events = await Event.find({ members: req.userId }).sort({ updatedAt: -1 });

    const eventHealth = events
      .map((event) =>
        buildEventHealth(event, {
          activityWindowHours,
          silentFailureHours,
          pendingTaskThreshold,
          deadlineWindowDays: DEFAULT_DEADLINE_WINDOW_DAYS
        })
      )
      .sort(sortHealth);

    const conflicts = await getConflictSummary(req.userId, {
      overloadThreshold
    });

    const alerts = buildOverviewAlerts(eventHealth, conflicts);
    const pendingTasks = eventHealth.reduce((total, item) => total + item.pendingTasks, 0);
    const completedTasks = eventHealth.reduce((total, item) => total + item.completedTasks, 0);
    const highestPressure = [...eventHealth]
      .filter((item) => item.pressure.value !== null)
      .sort((left, right) => (right.pressure.value || 0) - (left.pressure.value || 0))[0] || null;

    res.json({
      success: true,
      summary: {
        totalEvents: events.length,
        pendingTasks,
        completedTasks,
        warningEvents: eventHealth.filter((item) => item.status !== "healthy").length,
        silentFailures: eventHealth.filter((item) => item.silentFailure).length,
        nearDeadlines: eventHealth.filter((item) => item.nearDeadline).length,
        highPressureCount: eventHealth.filter((item) => item.pressure.level === "high").length,
        highestPressure
      },
      alerts,
      eventHealth,
      conflicts
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const getConflicts = async (req, res) => {
  try {
    const overloadThreshold = parsePositiveInt(
      req.query.overloadThreshold,
      DEFAULT_OVERLOAD_THRESHOLD
    );

    const conflicts = await getConflictSummary(req.userId, {
      overloadThreshold
    });

    res.json({ success: true, conflicts });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const getCalendarFeed = async (req, res) => {
  try {
    const overloadThreshold = parsePositiveInt(
      req.query.overloadThreshold,
      DEFAULT_OVERLOAD_THRESHOLD
    );
    const events = await Event.find({
      members: req.userId,
      isFinished: { $ne: true }
    }).sort({ deadline: 1, updatedAt: -1 });

    const conflicts = await getConflictSummary(req.userId, { overloadThreshold });
    const conflictTaskIds = new Set(conflicts.currentUserConflictTaskIds);

    const items = [];
    const unscheduledTasks = [];

    events.forEach((event) => {
      const health = buildEventHealth(event);
      const eventHasConflicts = conflicts.sameDayConflicts.some((conflict) =>
        conflict.tasks.some((task) => task.eventId === String(event._id))
      );

      if (event.deadline) {
        items.push({
          id: `event-deadline-${event._id}`,
          title: health.nearDeadline
            ? `Deadline near: ${event.eventName}`
            : `Deadline: ${event.eventName}`,
          start: event.deadline,
          allDay: true,
          extendedProps: {
            kind: "event-deadline",
            eventId: String(event._id),
            eventName: event.eventName,
            nearDeadline: health.nearDeadline,
            pressureLevel: health.pressure.level,
            pendingTasks: health.pendingTasks,
            warning: health.nearDeadline || health.pressure.level === "high" || eventHasConflicts
          }
        });
      }

      (event.tasks || []).forEach((task) => {
        // Updated check for array
        const isUserTask = task.assignedTo && task.assignedTo.some(id => String(id) === String(req.userId));
        if (!isUserTask || !ACTIVE_TASK_STATUSES.includes(task.status)) {
          return;
        }

        const effectiveDate = getEffectiveTaskDate(task, event.deadline);
        if (!effectiveDate) {
          unscheduledTasks.push({
            eventId: String(event._id),
            eventName: event.eventName,
            taskId: String(task._id),
            title: task.title,
            status: task.status
          });
          return;
        }

        items.push({
          id: `task-${task._id}`,
          title: task.title,
          start: effectiveDate,
          allDay: true,
          extendedProps: {
            kind: "task",
            eventId: String(event._id),
            eventName: event.eventName,
            taskId: String(task._id),
            status: task.status,
            conflict: conflictTaskIds.has(String(task._id)),
            usesEventDeadline: !task.dueDate && !!event.deadline,
            nearDeadline: isDeadlineNear(event.deadline, DEFAULT_DEADLINE_WINDOW_DAYS)
          }
        });
      });
    });

    res.json({
      success: true,
      items,
      conflicts,
      unscheduledTasks
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const getUserEvents = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate("createdEvents")
      .populate("joinedEvents");

    const organizerEvents = (user?.createdEvents || []).sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
    );
    const memberEvents = (user?.joinedEvents || [])
      .filter((event) => String(event.organizer) !== String(userId))
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));

    res.json({ success: true, organizerEvents, memberEvents });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    if (String(event.organizer) !== String(userId)) {
      return res.json({ success: false, error: "Only organizer can delete event" });
    }

    await User.updateMany(
      { joinedEvents: eventId },
      { $pull: { joinedEvents: eventId } }
    );

    await User.updateOne(
      { _id: userId },
      { $pull: { createdEvents: eventId } }
    );

    await Message.deleteMany({ eventId });
    await Event.findByIdAndDelete(eventId);

    return res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
};

export const joinEvent = async (req, res) => {
  try {
    const { eventCode } = req.body;
    const userId = req.userId;

    const event = await Event.findOne({ eventCode });
    if (!event) return res.json({ success: false, error: "Invalid event code" });

    if (event.members.some((memberId) => String(memberId) === String(userId))) {
      return res.json({ success: true, message: "Already joined", event });
    }

    const io = getIO();
    const user = await User.findById(userId);

    event.members.push(userId);
    event.activities.push({
      action: "join",
      message: `${user.username} joined the event`,
      user: userId
    });

    await event.save();

    io.to(String(event._id)).emit("activities-updated", event.activities);
    io.to(String(event._id)).emit("members-updated", event.members);

    await User.findByIdAndUpdate(userId, {
      $push: { joinedEvents: event._id }
    });

    res.json({ success: true, message: "Joined event", event });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, error: "Email is required" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    if (String(event.organizer) !== String(userId)) {
      return res.json({ success: false, error: "Only the organizer can add members directly" });
    }

    const newMember = await User.findOne({ email });
    if (!newMember) {
      return res.json({ 
        success: false, 
        error: "Not logged in user and member should be added by organizer only"
      });
    }

    if (event.members.some((memberId) => String(memberId) === String(newMember._id))) {
      return res.json({ success: false, error: "User is already a member of this event" });
    }

    const io = getIO();
    const organizerUser = await User.findById(userId);

    event.members.push(newMember._id);
    event.activities.push({
      action: "member-added",
      message: `${organizerUser.username} added ${newMember.username} to the event`,
      user: userId
    });

    await event.save();

    io.to(String(event._id)).emit("activities-updated", event.activities);
    io.to(String(event._id)).emit("members-updated", event.members);

    await User.findByIdAndUpdate(newMember._id, {
      $push: { joinedEvents: event._id }
    });

    res.json({ success: true, message: "Member added successfully" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const getEventDetails = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await loadEventWithRelations(eventId);

    if (!event) return res.json({ success: false, error: "Event not found" });

    const health = buildEventHealth(event);

    res.json({ success: true, event, health });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const getEventHealth = async (req, res) => {
  try {
    const activityWindowHours = parsePositiveInt(
      req.query.activityWindowHours,
      DEFAULT_ACTIVITY_WINDOW_HOURS
    );
    const silentFailureHours = parsePositiveInt(
      req.query.silentFailureHours,
      DEFAULT_SILENT_FAILURE_HOURS
    );
    const pendingTaskThreshold = parsePositiveInt(
      req.query.pendingTaskThreshold,
      DEFAULT_PENDING_TASK_THRESHOLD
    );

    const event = await Event.findById(req.params.id);
    if (!event) return res.json({ success: false, error: "Event not found" });

    const health = buildEventHealth(event, {
      activityWindowHours,
      silentFailureHours,
      pendingTaskThreshold
    });

    res.json({ success: true, health });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const getEventPressure = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.json({ success: false, error: "Event not found" });

    const pendingTasks = (event.tasks || []).filter((task) =>
      ACTIVE_TASK_STATUSES.includes(task.status)
    ).length;

    res.json({
      success: true,
      pressure: calculatePressure(pendingTasks, event.deadline),
      pendingTasks
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const updateEventDeadline = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;
    const { deadline } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    if (String(event.organizer) !== String(userId)) {
      return res.json({ success: false, error: "Only organizer can update deadline" });
    }

    event.deadline = deadline ? new Date(deadline) : null;

    const user = await User.findById(userId);
    event.activities.push({
      action: "deadline-updated",
      message: `${user.username} updated the event deadline`,
      user: userId
    });

    await event.save();

    const updatedEvent = await loadEventWithRelations(eventId);
    const io = getIO();
    io.to(String(eventId)).emit("activities-updated", updatedEvent.activities);
    io.to(String(eventId)).emit("event-updated", updatedEvent);

    res.json({
      success: true,
      message: "Event deadline updated",
      event: updatedEvent,
      health: buildEventHealth(updatedEvent)
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;
    const { title, description, assignedTo, dueDate } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    const isOrganizer = String(event.organizer) === String(userId);
    if (!isOrganizer) {
      return res.json({
        success: false,
        error: "Only organizers can create tasks"
      });
    }

    // assignedTo should be an array. If missing, default to empty array.
    let finalAssignedTo = [];
    if (Array.isArray(assignedTo)) {
      finalAssignedTo = assignedTo;
    } else if (assignedTo) {
      finalAssignedTo = [assignedTo];
    }

    const io = getIO();
    const user = await User.findById(userId);

    event.tasks.unshift({
      title,
      description,
      assignedTo: finalAssignedTo,
      createdBy: userId,
      dueDate: dueDate || null
    });

    event.activities.push({
      action: "task-created",
      message: `${user.username} created a task`,
      user: userId
    });

    await event.save();

    const updatedEvent = await loadEventWithRelations(eventId);
    io.to(String(eventId)).emit("activities-updated", updatedEvent.activities);
    io.to(String(eventId)).emit("tasks-updated", updatedEvent.tasks);

    res.json({ success: true, message: "Task added", tasks: updatedEvent.tasks });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    const task = event.tasks.id(taskId);
    if (!task) return res.json({ success: false, error: "Task not found" });

    // is user in assignedTo array?
    const isAssigned = task.assignedTo && task.assignedTo.some(id => String(id) === String(userId));
    if (!isAssigned && String(event.organizer) !== String(userId)) {
      return res.json({
        success: false,
        error: "Only assigned members or organizers can update status"
      });
    }

    task.status = status;

    const user = await User.findById(userId);
    event.activities.push({
      action: "task-updated",
      message: `${user.username} updated task status`,
      user: userId
    });

    await event.save();

    const updatedEvent = await loadEventWithRelations(eventId);
    const io = getIO();
    io.to(String(eventId)).emit("activities-updated", updatedEvent.activities);
    io.to(String(eventId)).emit("tasks-updated", updatedEvent.tasks);

    res.json({
      success: true,
      message: "Status updated",
      tasks: updatedEvent.tasks
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const updateTaskSchedule = async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const { dueDate } = req.body;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    const task = event.tasks.id(taskId);
    if (!task) return res.json({ success: false, error: "Task not found" });

    const isOrganizer = String(event.organizer) === String(userId);
    const isAssignedUser = task.assignedTo && task.assignedTo.some(id => String(id) === String(userId));

    if (!isOrganizer && !isAssignedUser) {
      return res.json({
        success: false,
        error: "Only organizer or assigned member can update task schedule"
      });
    }

    task.dueDate = dueDate ? new Date(dueDate) : null;

    const user = await User.findById(userId);
    event.activities.push({
      action: "task-scheduled",
      message: `${user.username} updated task schedule`,
      user: userId
    });

    await event.save();

    const updatedEvent = await loadEventWithRelations(eventId);
    const io = getIO();
    io.to(String(eventId)).emit("activities-updated", updatedEvent.activities);
    io.to(String(eventId)).emit("tasks-updated", updatedEvent.tasks);

    res.json({
      success: true,
      message: "Task schedule updated",
      tasks: updatedEvent.tasks
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const assignTaskMembers = async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const { assignedTo } = req.body; // Expecting an array of user IDs
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    const task = event.tasks.id(taskId);
    if (!task) return res.json({ success: false, error: "Task not found" });

    const isOrganizer = String(event.organizer) === String(userId);
    if (!isOrganizer) {
      return res.json({
        success: false,
        error: "Only organizer can assign members to a task"
      });
    }

    task.assignedTo = Array.isArray(assignedTo) ? assignedTo : [];

    const user = await User.findById(userId);
    event.activities.push({
      action: "task-assigned",
      message: `${user.username} updated task assignees`,
      user: userId
    });

    await event.save();

    const updatedEvent = await loadEventWithRelations(eventId);
    const io = getIO();
    io.to(String(eventId)).emit("activities-updated", updatedEvent.activities);
    io.to(String(eventId)).emit("tasks-updated", updatedEvent.tasks);

    res.json({
      success: true,
      message: "Task assignees updated",
      tasks: updatedEvent.tasks
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    if (String(event.organizer) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: "Only organizer can delete tasks"
      });
    }

    const user = await User.findById(userId);
    event.tasks.pull(taskId);
    event.activities.push({
      action: "task-deleted",
      message: `${user.username} deleted a task`,
      user: userId
    });

    await event.save();

    const updatedEvent = await loadEventWithRelations(eventId);
    const io = getIO();
    io.to(String(eventId)).emit("activities-updated", updatedEvent.activities);
    io.to(String(eventId)).emit("tasks-updated", updatedEvent.tasks);

    res.json({
      success: true,
      message: "Task deleted successfully",
      tasks: updatedEvent.tasks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const finishEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    if (String(event.organizer) !== String(userId)) {
      return res.json({ success: false, error: "Only organizer can finish event" });
    }

    event.isFinished = true;
    await event.save();

    const io = getIO();
    io.to(String(eventId)).emit("event-finished");
    io.to(String(eventId)).emit("event-updated", event);

    res.json({ success: true, message: "Event finished" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
