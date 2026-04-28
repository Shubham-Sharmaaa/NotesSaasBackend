import "./config/env.js";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin.endsWith(".vercel.app")) {
        cb(null, true);
      } else {
        cb(new Error("Blocked"));
      }
    },
  }),
);
import mongoose from "mongoose";
import authrouter from "./routes/authRouter.js";
import privateRouter from "./routes/privaterouter.js";
import LinkModel from "./models/LinkModel.js";
import NotesModel from "./models/NotesModel.js";
mongoose
  .connect(process.env.MONGO_URL as string)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
const secret = process.env.SECRET || "your_jwt_secret_key";
app.use(express.json());

export interface AuthRequest extends Request {
  userId?: string;
}
function isAuthorized(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(404).json({ message: "token not found" });

    const validtoken = jwt.verify(token, secret);

    const { userId } = validtoken as JwtPayload;
    req.userId = userId;
    next();
  } catch (err) {
    return res.status(500).json({ message: "Somthing went wrong", err });
  }
}
app.use("/auth", authrouter);
app.get("/get-note/:hash", async (req: AuthRequest, res: Response) => {
  try {
    const { hash } = req.params;
    if (!hash)
      return res.status(400).json({ message: "please provide proper input" });
    const link = await LinkModel.findOne({ hash });
    if (!link) return res.status(404).json({ message: "link not found" });
    const note = await NotesModel.findById(link.noteId);
    if (!note) return res.status(404).json({ message: "note not found" });
    return res.status(200).json({
      message: "note found",
      note: { id: note._id, title: note.title, body: note.body },
    });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
});
app.use("/private", isAuthorized, privateRouter);
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
