import mongoose from "mongoose";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MESSAGE SCHEMA DEFINITION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const messageSchema = new mongoose.Schema(
  {
    // Kis event ka message hai
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true  // Fast searching ke liye
    },
    
    // Kaun bhej raha hai
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    // Message content
    text: {
      type: String,
      required: true,
      trim: true,        // Extra spaces remove
      maxlength: 500     // Max 500 characters
    }
  },
  { 
    timestamps: true  // createdAt, updatedAt automatic
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INDEX FOR PERFORMANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Event wise messages quickly fetch karne ke liye
messageSchema.index({ eventId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
