import * as mongoose from "mongoose";
export const RoomSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["wait", "play"],
    default: ["wait"],
  },
  current: Number,
  correct: {
    type: Boolean,
    default: false,
  },
  players: [
    {
      name: String,
      score: Number,
      targetScore: Number,
      id: String,
    },
  ],
  ready: Number,
  answers: [
    {
      user: String,
      answer: Number,
      sub: { type: Number, default: 0 },
    },
  ],
  questions: [
    {
      question: String,
      type: {
        type: String,
        enum: ["text", "number"],
      },

      answers: [
        { id: Number, text: String },
        { id: Number, text: String },
        { id: Number, text: String },
        { id: Number, text: String },
      ],
      correct: Number,
    },
  ],
});

export interface Room {
  status: UserStatus;
  current: Number;
  correct: boolean;
  answers: [
    {
      user: string;
      answer: number;
      sub: number;
    }
  ];
  ready: number;
  palyers: [
    {
      name: string;
      id: string;
      score: number;
      targetScore: number;
    }
  ];
  questions: [
    {
      question: string;
      type: {
        type: string;
        enum: QuestionStatus;
      };

      answers: [
        { id: number; text: string },
        { id: number; text: string },
        { id: number; text: string },
        { id: Number; text: string }
      ];
      correct: number;
    }
  ];
}
export enum UserStatus {
  wait = "wait",
  play = "play",
}
export enum QuestionStatus {
  text = "text",
  number = "number",
}
