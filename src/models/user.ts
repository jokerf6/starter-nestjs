import * as mongoose from "mongoose";
export const UserSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["wait", "play"],
    default: ["wait"],
  },
  name: { type: String, required: true },

  id: { type: String, required: true },
  socketId: { type: String, required: true },
});

export interface User {
  id: string;

  status: UserStatus;
  name: string;
  socketId: string;
}
export enum UserStatus {
  wait = "wait",
  play = "play",
}
