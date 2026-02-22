import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
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
    }
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
