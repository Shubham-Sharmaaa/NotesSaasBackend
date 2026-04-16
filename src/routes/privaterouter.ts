import express, { type Response } from "express";
import type { AuthRequest } from "../server.js";
import NotesModel from "../models/NotesModel.js";
import mongoose from "mongoose";
import LinkModel from "../models/LinkModel.js";
import bcrypt from "bcrypt";
const privateRouter = express.Router();

privateRouter.get("/test", (req, res) => {
  res.json({ message: "test endpoint successful" });
});
privateRouter.post(
  "/create-content",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(410).json({ message: "no userId" });
      const { title, body, isFavorite } = req.body;
      if (!title || !body || isFavorite === undefined || isFavorite === null)
        return res
          .status(410)
          .json({ message: "please provide title and body" });
      const newContent = await NotesModel.create({
        title,
        body,
        userId,
        isFavorite,
      });
      if (!newContent)
        return res
          .status(500)
          .json({ message: "something happened while creating user" });
      return res.status(200).json({ message: "new note created", newContent });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);
privateRouter.get("/all-content", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(410).json({ message: "no userId" });
    const notes = await NotesModel.find({ userId });
    return res.status(200).json({
      message: "here is all the notes of user",
      notes: notes.map((note) => {
        return {
          title: note.title,
          body: note.body,
          createdAt: note.createdAt,
          _id: note._id,
          isPinned: note.isPinned,
          isFavorite: note.isFavorite,
          isDeleted: note.isDeleted,
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
privateRouter.put("/move-trash", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.body;
    if (!id)
      return res.status(403).json({ message: "please provide proper input" });
    const deletedNote = await NotesModel.findByIdAndUpdate(id, {
      isDeleted: true,
      isFavorite: false,
      isPinned: false,
    });
    return res
      .status(200)
      .json({ message: "user added to trash", deletedNote });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
privateRouter.put("/remove-trash", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.body;
    if (!id)
      return res.status(403).json({ message: "please provide proper input" });
    const note = await NotesModel.findByIdAndUpdate(id, {
      isDeleted: false,
    });
    return res
      .status(200)
      .json({ message: "user removed from trash successfully", note });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
privateRouter.delete(
  "/delete-note",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { id } = req.body;
      if (!id)
        return res.status(403).json({ message: "please provide proper input" });
      const deletedNote = await NotesModel.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!deletedNote) {
        return res.status(404).json({ message: "Note not found" });
      }

      return res.status(200).json({
        message: "Note deleted successfully",
        deletedNote,
      });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);
privateRouter.put("/update-note", async (req: AuthRequest, res: Response) => {
  try {
    // const userId = req.userId;
    const { title, body, id } = req.body;
    if (!title || !body || !id) {
      return res.status(400).json({ message: "give valid input" });
    }
    const updatedNote = await NotesModel.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          body,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({ message: "Note updated", note: updatedNote });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
privateRouter.put(
  "/toggle-favorite",
  async (req: AuthRequest, res: Response) => {
    try {
      const { noteId, isFavorite } = req.body;
      if (!noteId || isFavorite === null || isFavorite === undefined)
        return res.status(400).json({ message: "Please provide a noteId" });
      const note = await NotesModel.findById(noteId);
      if (!note) return res.status(404).json({ message: "note not found" });
      note.isFavorite = !note.isFavorite;
      await note.save();
      return res.status(200).json({ message: "Success", newNote: note });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);
privateRouter.put("/pin-note", async (req: AuthRequest, res: Response) => {
  try {
    const { noteId } = req.body;
    if (!noteId)
      return res.status(400).json({ message: "Please provide a noteId" });
    const note = await NotesModel.findById(noteId);
    if (!note) return res.status(404).json({ message: "note not found" });
    note.isPinned = !note.isPinned;
    await note.save();
    return res.status(200).json({ message: "Success", newNote: note });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
privateRouter.get("/get-note/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "give id param" });
    const note = await NotesModel.findById(id);
    return res.status(200).json({
      message: "here is the note",
      note: { title: note?.title, body: note?.body },
    });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
privateRouter.post("/create-link", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { noteId } = req.body;
    if (!noteId)
      return res.status(400).json({ message: "please provide proper input" });
    const linkexists = await LinkModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      noteId: new mongoose.Types.ObjectId(noteId),
    });
    if (linkexists)
      return res
        .status(200)
        .json({ message: "here is the link", link: linkexists.hash });
    const hash = await bcrypt.hash(noteId, 10);
    const newLink = await LinkModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      noteId: new mongoose.Types.ObjectId(noteId),
      hash,
    });
    return res
      .status(200)
      .json({ message: "new link created", link: newLink.hash });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
privateRouter.delete(
  "/delete-link",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { id } = req.body;
      if (!id)
        return res.status(400).json({ message: "please provide proper input" });
      const deletedLink = await LinkModel.deleteOne({
        noteId: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });
      return res
        .status(200)
        .json({ message: "link deleted successfully", deletedLink });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);
privateRouter.delete(
  "/delete-all-links",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const deletedLinks = await LinkModel.deleteMany({
        userId: new mongoose.Types.ObjectId(userId),
      });
      return res
        .status(200)
        .json({ message: "all links deleted successfully", deletedLinks });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);
export default privateRouter;
