import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    createdEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
      }
    ],

    joinedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
      }
    ],

    tasks: [
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        taskId: { type: mongoose.Schema.Types.ObjectId }
      }
    ]
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
