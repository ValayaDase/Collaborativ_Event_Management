import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createEvent,
  getDashboardOverview,
  getConflicts,
  getCalendarFeed,
  getUserEvents,
  deleteEvent,
  joinEvent,
  addMember,
  getEventDetails,
  getEventHealth,
  getEventPressure,
  updateEventDeadline,
  createTask,
  updateTaskStatus,
  updateTaskSchedule,
  deleteTask,
  finishEvent,
  assignTaskMembers
} from "../controllers/eventController.js";

const router = express.Router();

router.post("/create", auth, createEvent);
router.get("/dashboard/overview", auth, getDashboardOverview);
router.get("/conflicts", auth, getConflicts);
router.get("/calendar/feed", auth, getCalendarFeed);
router.get("/user-events", auth, getUserEvents);
router.delete("/:id", auth, deleteEvent);
router.post("/join", auth, joinEvent);
router.post("/:id/members/add", auth, addMember);
router.get("/:id", auth, getEventDetails);
router.get("/:id/health", auth, getEventHealth);
router.get("/:id/pressure", auth, getEventPressure);
router.patch("/:id/deadline", auth, updateEventDeadline);
router.post("/:id/tasks", auth, createTask);
router.patch("/:eventId/tasks/:taskId/status", auth, updateTaskStatus);
router.patch("/:eventId/tasks/:taskId/schedule", auth, updateTaskSchedule);
router.patch("/:eventId/tasks/:taskId/assign", auth, assignTaskMembers);
router.delete("/:eventId/tasks/:taskId", auth, deleteTask);
router.post("/:id/finish", auth, finishEvent);

export default router;
