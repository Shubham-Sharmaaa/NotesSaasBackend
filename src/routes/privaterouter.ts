import express, { type Response } from "express";
import type { AuthRequest } from "../server.js";
import NotesModel from "../models/NotesModel.js";
import mongoose from "mongoose";
import LinkModel from "../models/LinkModel.js";
import bcrypt from "bcrypt";
import FolderModel from "../models/FolderModel.js";
import FolderNoteModel from "../models/FolderNoteModel.js";
const privateRouter = express.Router();

privateRouter.get("/test", (req, res) => {
  res.json({ message: "test endpoint successful" });
});

//CONTENT
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
          deleteDate: note.deleteDate,
          isArchived: note.isArchived,
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});

//DELETE
privateRouter.put("/move-trash", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.body;
    if (!id)
      return res.status(403).json({ message: "please provide proper input" });
    const deletedNote = await NotesModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        isFavorite: false,
        isPinned: false,
        deleteDate: Date.now(),
      },
      { new: true },
    );
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
      deleteDate: null,
    }).select("_id isDeleted deleteDate");
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

//UPDATE
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

//TOGGLES
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
privateRouter.put(
  "/toggle-archive",
  async (req: AuthRequest, res: Response) => {
    try {
      const { noteId } = req.body;
      if (!noteId)
        return res.status(400).json({ message: "Please provide a noteId" });
      const note = await NotesModel.findById(noteId);
      if (!note) return res.status(404).json({ message: "note not found" });
      note.isArchived = !note.isArchived;
      await note.save();
      return res.status(200).json({ message: "Success", newNote: note });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);

//LINK
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

//FOLDER
privateRouter.get("/all-folders", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const folders = await FolderModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "foldernotes",
          localField: "_id",
          foreignField: "folderId",
          as: "notes",
        },
      },
      {
        $addFields: {
          noteCount: { $size: "$notes" },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          isDeleted: 1,
          createdAt: 1,
          deletedDate: 1,
          noteCount: 1,
        },
      },
    ]);
    return res.status(200).json({ message: "here is the folders", folders });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
privateRouter.get(
  "/get-folder-notes/:folderId",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { folderId } = req.params;
      if (typeof folderId !== "string")
        return res.status(400).json({ message: "give proper input" });
      const folder = await FolderModel.findOne({
        _id: folderId,
        userId: new mongoose.Types.ObjectId(userId),
      });
      if (!folder)
        return res.status(410).json({ message: " no folder or unauthorized" });
      const relation = await FolderNoteModel.find({
        folderId: new mongoose.Types.ObjectId(folderId),
        userId: new mongoose.Types.ObjectId(userId),
      }).select("noteId");
      const noteIds = relation.map((r) => r.noteId);
      const notes = await NotesModel.find({
        _id: {
          $in: noteIds,
        },
      });
      return res.status(200).json({ message: "here is the notes", notes });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);
privateRouter.post(
  "/create-folder",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { folderName } = req.body;
      if (!folderName)
        return res.status(400).json({ message: "provide valid inpuit" });
      const newFolder = await FolderModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        name: folderName,
      });
      const formated = {
        _id: newFolder._id,
        name: newFolder.name,
        deletedDate: newFolder.deletedDate,
        createdAt: newFolder.createdAt,
        isDeleted: newFolder.isDeleted,
      };
      if (!newFolder)
        return res.status(500).json({ message: "couldnt create folder" });
      return res
        .status(200)
        .json({ message: "new folder created", newFolder: formated });
    } catch (e) {
      return res
        .status(500)
        .json({ message: "something went wrong", error: e });
    }
  },
);
privateRouter.put(
  "/move-item-to-folder",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { noteId, folderId } = req.body;
      if (!noteId || !folderId)
        return res.status(400).json({ message: "please provide input" });
      const note = await NotesModel.findOne({
        _id: new mongoose.Types.ObjectId(noteId),
        userId: new mongoose.Types.ObjectId(userId),
      }).select(
        "_id title body createdAt isPinned isFavorite isDeleted deleteDate isArchived",
      );
      if (!note)
        return res
          .status(404)
          .json({ message: "no note found or unauthorized" });
      const folder = await FolderModel.findOne({
        _id: new mongoose.Types.ObjectId(folderId),
        userId: new mongoose.Types.ObjectId(userId),
      });
      if (!folder)
        return res
          .status(404)
          .json({ message: "no folder found or unauthorized " });
      await FolderNoteModel.create({
        folderId: new mongoose.Types.ObjectId(folderId),
        userId: new mongoose.Types.ObjectId(userId),
        noteId: note._id,
      });

      return res.status(200).json({ message: "note added to folder", note });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);
privateRouter.delete(
  "/delete-folder",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const { folderId } = req.body;
      if (!folderId)
        return res.status(400).json({ message: "give proper input" });
      const folder = await FolderModel.findOne({
        _id: new mongoose.Types.ObjectId(folderId),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!folder)
        return res
          .status(404)
          .json({ message: "Folder not found or unauthorized" });
      await FolderNoteModel.deleteMany({
        folderId: new mongoose.Types.ObjectId(folderId),
        userId: new mongoose.Types.ObjectId(userId),
      });
      await folder?.deleteOne();

      return res.status(200).json({ message: "folder deleted" });
    } catch (err) {
      return res.status(500).json({ message: "something went wrong", err });
    }
  },
);

export default privateRouter;
