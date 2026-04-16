import mongoose from "mongoose";

const NotesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isFavorite: {
    type: Boolean,
    required: true,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deleteDate: {
    type: Date || null,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
});

const NotesModel = mongoose.model("Notes", NotesSchema);

export default NotesModel;
