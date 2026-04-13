import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
});

export default mongoose.model("Link", LinkSchema);
