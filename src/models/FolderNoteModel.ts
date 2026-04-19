import { model, Schema, Types } from "mongoose";

const FolderNoteSchema = new Schema({
  folderId: {
    type: Types.ObjectId,
    ref: "Folder",
    required: true,
  },
  noteId: {
    type: Types.ObjectId,
    ref: "Note",
    required: true,
  },
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
});
FolderNoteSchema.index({ folderId: 1, noteId: 1, userId: 1 }, { unique: true });
export default model("FolderNote", FolderNoteSchema);
