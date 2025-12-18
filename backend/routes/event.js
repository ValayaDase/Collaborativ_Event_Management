import express from "express";
import crypto from "crypto";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { auth } from "../middleware/auth.js";
import { Message } from "../models/Message.js";
import { getIO } from "../socket.js";

const router = express.Router();

// ---------- CREATE EVENT (already using this) ----------
router.post("/create", auth, async (req, res) => {
  try {
    const { eventName } = req.body;
    const userId = req.userId;

    const eventCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const event = await Event.create({
      eventName,
      eventCode,
      organizer: userId,
      members: [userId]
    });

    // after add information to event collection we have to update user collection of that user

    await User.findByIdAndUpdate(userId, {
      $push: { createdEvents: event._id, joinedEvents: event._id }
    });           // created event and joined event both are array in user model push help to add new event id to these arrays

    return res.json({
      success: true,
      message: "Event created successfully",
      eventCode,
      event
    });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// ---------- DELETE EVENT ----------
router.delete("/:id",auth,async(req,res)=>{
  try{
    const eventId = req.params.id;
    const userId = req.userId;

    const event = await Event.findById(eventId);
    if(!event) return res.json({success:false,error:"Event not found"});

    if(String(event.organizer)!==String(userId)){
      return res.json({success:false,error:"Only organizer can delete event"});
    }

    // remove event from all members dashboards
    await User.updateMany(
      {joinedEvents: eventId },
      { $pull: { joinedEvents: eventId } }
    );

    // remove event from organizer created events
    await User.updateOne(
      { _id: userId },
      { $pull: { createdEvents: eventId } }  // pull operator use to remove specific value from createdEvents array
    );

    // delete all chats of this event
    await Message.deleteMany({ eventId });

    // delete event itself
    await Event.findByIdAndDelete(eventId);

    return res.json({success:true,message:"Event deleted successfully"});
  }
  catch(err){
    return res.json({success:false,error:err.message});
  }
})








// ---------- JOIN EVENT (already using this) ----------
router.post("/join", auth, async (req, res) => {
  try {
    const { eventCode } = req.body;
    const userId = req.userId;

    const event = await Event.findOne({ eventCode });

    if (!event) return res.json({ success: false, error: "Invalid event code" });

    if (event.members.includes(userId)) {
      return res.json({ success: true, message: "Already joined", event });
    }       // if member id is already in members array then no need to add again

    event.members.push(userId);     // add user id to members array of that event
    await event.save();

    await User.findByIdAndUpdate(userId, {
      $push: { joinedEvents: event._id }
    });        // add event id to joined events array of that user

    const io = getIO();   //getIO() tumhara Socket.io ka main server instance deta hai. 
    io.to(String(event._id)).emit("members-updated", event.members);  // notify all members about new member joined

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
    res.json({ success: false, error: err.message });
  }
});

// ---------- ASSIGN TASK (ORGANIZER ONLY) ----------
router.post("/:id/tasks", auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.userId;
    const { title, description, assignedTo } = req.body;

    const event = await Event.findById(eventId);

    if (!event) return res.json({ success: false, error: "Event not found" });

    if (event.organizer.toString() !== userId.toString()) {
      return res.json({ success: false, error: "Only organizer can assign tasks" });
    }

    event.tasks.push({
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

    const task = event.tasks.id(taskId);
    if (!task) return res.json({ success: false, error: "Task not found" });

    // Ensure assignedTo is normalized
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
      message: "Status updated",
      tasks: updatedEvent.tasks
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
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
    res.json({ success: false, error: err.message });
  }
});

export default router;
