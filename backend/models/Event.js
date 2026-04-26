import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo"
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type:  mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    eventCode: { type: String, unique: true, required: true },
    deadline: Date,

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    tasks: [taskSchema],

    isFinished: {
      type: Boolean,
      default: false
    },
    activities: [
      {
        action: String,
        message: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
