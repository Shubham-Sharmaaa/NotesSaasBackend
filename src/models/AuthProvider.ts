import mongoose from "mongoose";
export interface IAuthProvider {
  userId: mongoose.Types.ObjectId;
  provider: "google" | "github" | "local";
  providerId: string;
  password?: string;
}
const authProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: {
    type: String,
    enum: ["google", "github", "local"],
    required: true,
  },
  providerId: { type: String, required: true },
  password: { type: String },
});

const AuthProvider = mongoose.model("AuthProvider", authProviderSchema);
export default AuthProvider;
