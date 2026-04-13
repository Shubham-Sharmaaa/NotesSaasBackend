import mongoose from "mongoose";

const NotesSchema = new mongoose.Schema({
  title: { type: String, require: true },
  body: { type: String },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const NotesModel = mongoose.model("Notes", NotesSchema);

export default NotesModel;
