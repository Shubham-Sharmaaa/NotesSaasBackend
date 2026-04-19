import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedDate: {
    type: Date,
    default: null,
  },
});
export default mongoose.model("Folder", FolderSchema);
