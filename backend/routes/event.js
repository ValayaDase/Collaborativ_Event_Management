import express from "express";
import crypto from "crypto";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { Message } from "../models/Message.js";
import { getIO } from "../socket.js";

const router = express.Router();

// ---------- CREATE EVENT ----------
router.post("/create", auth, async (req, res) => {
  try {
    const { eventName } = req.body;
    const userId = req.userId;

    const eventCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const event = await Event.create({
      eventName,
      eventCode,
      organizer:  userId,
      members: [userId]
    });

    await User.findByIdAndUpdate(userId, {
      $push:  { createdEvents: event._id, joinedEvents: event._id }
    });

    return res.json({
      success: true,
      message:  "Event created successfully",
      eventCode,
      event
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ---------- DELETE EVENT ----------
router. delete("/:id",auth,async(req,res)=>{
  try{
    const eventId = req.params.id;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if(!event) return res.json({success:false,error:"Event not found"});

    if(String(event.organizer)!==String(userId)){
      return res.json({success:false,error:"Only organizer can delete event"});
    }

    await User.updateMany(
      {joinedEvents: eventId },
      { $pull: { joinedEvents: eventId } }
    );

    await User.updateOne(
      { _id: userId },
      { $pull: { createdEvents: eventId } }
    );

    await Message.deleteMany({ eventId });
    await Event.findByIdAndDelete(eventId);

    return res.json({success:true,message:"Event deleted successfully"});
  }
  catch(err){
    return res.json({success:false,error:err.message});
  }
});

// ---------- JOIN EVENT ----------
router. post("/join", auth, async (req, res) => {
  try {
    const { eventCode } = req.body;
    const userId = req.userId;

    const event = await Event.findOne({ eventCode });

    if (!event) return res.json({ success: false, error:  "Invalid event code" });

    if (event.members.includes(userId)) {
      return res. json({ success: true, message:  "Already joined", event });
    }

    event.members.push(userId);
    await event.save();

    await User.findByIdAndUpdate(userId, {
      $push: { joinedEvents:  event._id }
    });

    const io = getIO();
    io.to(String(event._id)).emit("members-updated", event.members);

    res.json({ success: true, message: "Joined event", event });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ---------- FETCH EVENTS FOR DASHBOARD ----------
router.get("/user-events", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate("createdEvents")
      .populate("joinedEvents");

    const organizerEvents = user.createdEvents;
    const memberEvents = user.joinedEvents.filter(
      (ev) => ev.organizer.toString() !== userId
    );

    res.json({ success: true, organizerEvents, memberEvents });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ---------- GET SINGLE EVENT DETAILS ----------
router.get("/:id", auth, async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId)
      .populate("organizer", "username email")
      .populate("members", "username email")
      .populate("tasks.assignedTo", "username email");

    if (!event) return res.json({ success: false, error: "Event not found" });

    res.json({ success: true, event });
  } catch (err) {
    res.json({ success: false, error:  err.message });
  }
});

// ---------- ASSIGN TASK (ORGANIZER ONLY) ----------
router.post("/:id/tasks", auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;
    const { title, description, assignedTo } = req.body;

    const event = await Event.findById(eventId);

    if (!event) return res.json({ success: false, error:  "Event not found" });

    if (event.organizer.toString() !== userId.toString()) {
      return res.json({ success: false, error: "Only organizer can assign tasks" });
    }

    // Add task at the beginning (unshift) so new tasks appear at top
    event.tasks.unshift({
      title,
      description,
      assignedTo
    });

    await event.save();
    await event.populate("tasks.assignedTo", "username email");

    const io = getIO();
    io.to(String(eventId)).emit("tasks-updated", event.tasks);

    res.json({ success: true, message: "Task added", tasks: event.tasks });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ---------- UPDATE TASK STATUS (ONLY ASSIGNED MEMBER) ----------
router.patch("/:eventId/tasks/:taskId/status", auth, async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    const task = event.tasks. id(taskId);
    if (!task) return res.json({ success: false, error: "Task not found" });

    const assignedId = String(task.assignedTo);

    if (assignedId !== String(userId)) {
      return res.json({
        success: false,
        error: "Only assigned member can update status"
      });
    }

    task.status = status;
    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate("tasks.assignedTo", "username email");

    const io = getIO();
    io.to(String(eventId)).emit("tasks-updated", updatedEvent.tasks);

    res.json({
      success: true,
      message:  "Status updated",
      tasks:  updatedEvent.tasks
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ---------- DELETE TASK (ORGANIZER ONLY) ----------
router.delete("/:eventId/tasks/:taskId", auth, async (req, res) => {
  try {
    const { eventId, taskId } = req.params;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    // Check if user is organizer
    if (event.organizer.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: "Only organizer can delete tasks" 
      });
    }

    // Remove the task using pull (works with subdocuments)
    event.tasks.pull(taskId);
    await event.save();

    // Populate and emit updated tasks
    await event.populate("tasks.assignedTo", "username email");

    const io = getIO();
    io.to(String(eventId)).emit("tasks-updated", event.tasks);

    res.json({ 
      success: true, 
      message: "Task deleted successfully",
      tasks: event.tasks 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- FINISH EVENT (ORGANIZER ONLY) ----------
router.post("/:id/finish", auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.json({ success: false, error: "Event not found" });

    if (event.organizer.toString() !== userId.toString()) {
      return res.json({ success: false, error: "Only organizer can finish event" });
    }

    event.isFinished = true;
    await event.save();

    const io = getIO();
    io.to(String(eventId)).emit("event-finished");

    res.json({ success: true, message: "Event finished" });
  } catch (err) {
    res.json({ success: false, error: err. message });
  }
});

export default router;