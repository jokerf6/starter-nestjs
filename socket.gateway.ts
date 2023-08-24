import { InjectModel } from "@nestjs/mongoose";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Model } from "mongoose";
import { Socket, Server } from "socket.io";
import { Room } from "src/models/room";
import { User, UserStatus } from "src/models/user";
import { QuestionService } from "src/question/question.service";

@WebSocketGateway({ cors: "*" })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectModel("user") private readonly userModel: Model<User>,
    @InjectModel("room") private readonly roomModel: Model<Room>,
    private readonly questionService: QuestionService
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log("WebSocket server initialized");
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    await this.userModel.deleteOne({ socketId: client.id });
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(client: Socket, payload: { name: string; id: string }) {
    const createdUser = new this.userModel({
      id: payload.id,
      name: payload.name,
      status: UserStatus.wait,
      socketId: client.id,
    });
    await createdUser.save();

    const userID = payload.id;
    const waitingRooms = await this.roomModel.find({ status: UserStatus.wait });
    if (waitingRooms.length === 0) {
      const questions = await this.questionService.findAll();
      const newRoom = new this.roomModel({
        status: UserStatus.wait,
        ready: 0,
        players: [
          {
            name: payload.name,
            id: userID,
            score: 0,
            targetScore: 0,
          },
        ],
        answers: [],
        current: 0,
        questions: questions,
      });
      await newRoom.save();
    } else {
      const currentPlayes = waitingRooms[0]["players"];
      // console.log(waitingRooms[0]);
      // console.log(currentPlayes);
      currentPlayes.push({
        name: payload.name,
        id: userID,
        score: 0,
        targetScore: 0,
      });
      // console.log(currentPlayes);

      await this.roomModel.updateOne(
        { _id: waitingRooms[0]._id },
        {
          $set: {
            players: currentPlayes,
            status: UserStatus.play,
          },
        }
      );
      for (let i = 0; i < currentPlayes.length; i++) {
        await this.userModel.updateOne(
          { id: currentPlayes[i]["id"] },
          { $set: { status: UserStatus.play } }
        );
      }
      this.server.emit("Ready", {
        roomId: waitingRooms[0]["_id"],
        players: waitingRooms[0]["players"],
      });
    }

    // console.log(`client-> ${payload.name} and id :${x}`);
  }
  //
  // private removeClientFromRooms(client: Socket) {
  //   for (const roomClients of this.rooms.values()) {
  //     roomClients.delete(client);
  //   }
  // }

  @SubscribeMessage("sendMessage")
  handleMessage(client: Socket, payload: { text: string }): void {
    console.log(`Received message from ${client.id}`);
    // Add your logic to handle the incoming message here, for example, broadcasting it to other clients:
    this.server.emit("newMessage", { text: payload.text });
  }
  @SubscribeMessage("nextQuestion")
  async handleQuestions(
    client: Socket,
    payload: { roomId: string; current: number }
  ) {
    const room = await this.roomModel.findOne({ _id: payload.roomId });
    const current: number = room["current"].valueOf();
    const question = room["questions"][payload.current];
    const players = room["players"];
    for (let i = 0; i < players.length; i += 1) {
      // console.log(players[i]);
      players[i]["score"] = players[i]["score"] + players[i]["targetScore"];
      players[i]["targetScore"] = 0;
      // console.log(players[i]);
      // console.log("-------------------");
    }

    // console.log("//////////////////////");
    players.sort((a: any, b: any) => b.score - a.score);

    await this.roomModel.updateOne(
      { _id: payload.roomId },
      { $set: { current: payload.current, players: players, answers: [] } }
    );

    // Add your logic to handle the incoming message here, for example, broadcasting it to other clients:
    this.server.emit("Question", {
      roomId: payload.roomId,
      question: question,
      players: players,
    });
  }

  @SubscribeMessage("currentQuestion")
  async currentQuestion(client: Socket, payload: { roomId: string }) {
    const room = await this.roomModel.findOne({ _id: payload.roomId });
    const current: number = room["current"].valueOf();
    const question = room["questions"][current];
    const players = room["players"];
    this.server.emit("finish", { roomId: payload.roomId });

    this.server.emit("Question", {
      roomId: payload.roomId,
      question: question,
      players: players,
    });
  }
  @SubscribeMessage("answer")
  async handleAnswer(
    client: Socket,
    payload: { roomId: string; userId: string; answer: number; type: string }
  ) {
    // console.log(payload.roomId);
    // console.log(payload.answer);
    // console.log(payload.type);

    await this.roomModel.updateOne(
      { _id: payload.roomId },
      { $push: { answers: { user: payload.userId, answer: payload.answer } } }
    );
    const room = await this.roomModel.findOne({ _id: payload.roomId });
    if (!room["correct"]) {
      await this.roomModel.updateOne(
        { _id: payload.roomId },
        { $set: { current: room["current"].valueOf() + 1, correct: true } }
      );
      room["current"] = room["current"].valueOf() + 1;
    }

    if (room["answers"].length === room["players"].length) {
      await this.roomModel.updateOne(
        { _id: payload.roomId },
        { $set: { correct: false } }
      );
      const players = room["players"];
      this.server.emit("finish", { roomId: payload.roomId });

      const answers = room["answers"];
      const correctPlayers: any = [];
      for (let i = 0; i < players.length; i += 1) {
        // console.log(players[i]);
        players[i]["score"] = players[i]["score"] + players[i]["targetScore"];
        players[i]["targetScore"] = 0;
        // console.log(players[i]);
        // console.log("-------------------");
      }
      let answer1: number = 0;
      let answer2: number = 0;
      let answer3: number = 0;
      let answer4: number = 0;

      let j = 0;
      const correctIndex = room["questions"][
        room["current"].valueOf() - 1
      ].answers.findIndex(
        (obj: any) =>
          obj.id === room["questions"][room["current"].valueOf() - 1]["correct"]
      );
      for (let i = 0; i < answers.length; i += 1) {
        answers[i]["sub"] = Math.abs(
          answers[i]["answer"] -
            parseInt(
              room["questions"][room["current"].valueOf() - 1]["answers"][
                correctIndex
              ].text
            )
        );
      }
      answers.sort((a, b) => a.sub - b.sub);
      for (let i = 0; i < answers.length; i += 1) {
        if (
          (payload.type === "text" &&
            answers[i]["answer"] ===
              room["questions"][room["current"].valueOf() - 1]["correct"] &&
            j < 3) ||
          payload.type === "number"
        ) {
          const index = players.findIndex(
            (obj: any) => obj.id === answers[i]["user"]
          );
          // console.log(players);
          players[index]["targetScore"] = 100 - j * 10;
          j++;

          correctPlayers.push({
            name: players[index]["name"],
          });
        }
        if (payload.type === "text") {
          if (answers[i]["answer"] == 1) answer1 += 1;
          if (answers[i]["answer"] == 2) answer2 += 1;
          if (answers[i]["answer"] == 3) answer3 += 1;
          if (answers[i]["answer"] == 4) answer4 += 1;
        }
      }
      await this.roomModel.updateOne(
        { _id: payload.roomId },
        { $set: { players: players } }
      );

      const correctAnswers =
        room["questions"][room["current"].valueOf() - 1]["answers"][
          correctIndex
        ];
      await this.roomModel.updateOne(
        { _id: payload.roomId },
        { $set: { answers: [] } }
      );
      const indexUser = players.findIndex(
        (obj: any) => obj.id === payload.userId
      );
      const current: number = room["current"].valueOf();
      const question = room.questions[current];
      // for (let i = 0; i < players.length; i += 1) {
      //   // console.log(players[i]);
      //   players[i]["score"] = players[i]["score"] + players[i]["targetScore"];
      //   players[i]["targetScore"] = 0;
      //   // console.log(players[i]);
      //   // console.log("-------------------");
      // }
      players.sort(
        (a: any, b: any) => b.score + b.targetScore - (a.score + a.targetScore)
      );

      // console.log("--------------------------------");
      // console.log(players[indexUser]);
      console.log("/*/*/*/*/*/*");
      console.log(current);
      if (payload.type === "text") {
        this.server.emit("toCorrect", {
          roomId: payload.roomId,
          allAnswers: answers.length,
          answer1: answer1,
          answer2: answer2,
          answer3: answer3,
          answer4: answer4,
          finish: current === 10 ? true : false,
          correctAnswer: correctAnswers,
          correctPlayers: correctPlayers,
          targetScore: players[indexUser]["targetScore"],
          score: players[indexUser]["score"],
          userId: payload.userId,
          last: room["questions"][Math.max(current - 1, 0)],
          question: question,
          players: players,
        });
        // for (let i = 0; i < players.length; i += 1) {
        //   // console.log(players[i]);
        //   players[i]["score"] = players[i]["score"] + players[i]["targetScore"];
        //   players[i]["targetScore"] = 0;
        //   // console.log(players[i]);
        //   // console.log("-------------------");
        // }
      } else {
        this.server.emit("toCorrectNumber", {
          roomId: payload.roomId,
          allAnswers: answers,
          correctAnswer: correctAnswers,
          correctPlayers: correctPlayers,
          finish: current === 10 ? true : false,

          targetScore: players[indexUser]["targetScore"],
          score: players[indexUser]["score"],
          userId: payload.userId,
          players: players,
          question: question,

          last: room["questions"][Math.max(current - 1, 0)],
        });
        // for (let i = 0; i < players.length; i += 1) {
        //   // console.log(players[i]);
        //   players[i]["score"] = players[i]["score"] + players[i]["targetScore"];
        //   players[i]["targetScore"] = 0;
        //   // console.log(players[i]);
        //   // console.log("-------------------");
        // }
      }
    }
    //
    // Add your logic to handle the incoming message here, for example, broadcasting it to other clients:
  }

  @SubscribeMessage("ready")
  async handleReady(client: Socket, payload: { roomId: string }) {
    const room = await this.roomModel.findOne({ _id: payload.roomId });
    await this.roomModel.updateOne(
      { _id: payload.roomId },
      { $set: { ready: room["ready"] + 1 } }
    );
    await this.server.emit("userReady", {
      ready: room["ready"] + 1,
      roomId: payload.roomId,
    });
    // console.log(room["ready"]);
    // console.log(room["players"]);
    if (room["ready"] + 1 === room["players"].length) {
      await this.roomModel.updateOne(
        { _id: payload.roomId },
        { $set: { ready: 0 } }
      );
      this.server.emit("next", {
        roomId: payload.roomId,
      });
    }
  }
  @SubscribeMessage("correctTimeOut")
  async handlecorrectTimeOut(
    client: Socket,
    payload: { roomId: string; type: string; userId: string }
  ) {
    const room = await this.roomModel.findOne({ _id: payload.roomId });
    if (!room["correct"]) {
      await this.roomModel.updateOne(
        { _id: payload.roomId },
        { $set: { current: room["current"].valueOf() + 1, correct: true } }
      );
      room["current"] = room["current"].valueOf() + 1;
    }
    const players = room["players"];
    if (players.length.valueOf() === 1) {
      this.server.emit("finish", { roomId: payload.roomId });
    }
    const answers = room["answers"];
    const correctPlayers: any = [];
    for (let i = 0; i < players.length; i += 1) {
      // console.log(players[i]);
      players[i]["score"] = players[i]["score"] + players[i]["targetScore"];
      players[i]["targetScore"] = 0;
      // console.log(players[i]);
      // console.log("-------------------");
    }
    let answer1: number = 0;
    let answer2: number = 0;
    let answer3: number = 0;
    let answer4: number = 0;

    let j = 0;

    console.log("hi");
    console.log(answers.length);

    // if(answers.length.valueOf() === 0){
    //   await this.roomModel.updateOne(
    //     { _id: payload.roomId },
    //     { $set: { current: room["current"].valueOf() + 1 } }
    //   );
    // }
    const correctIndex = room["questions"][
      room["current"].valueOf() - 1
    ].answers.findIndex(
      (obj: any) =>
        obj.id === room["questions"][room["current"].valueOf() - 1]["correct"]
    );
    for (let i = 0; i < answers.length; i += 1) {
      answers[i]["sub"] = Math.abs(
        answers[i]["answer"] -
          parseInt(
            room["questions"][room["current"].valueOf() - 1]["answers"][
              correctIndex
            ].text
          )
      );
    }
    answers.sort((a, b) => a.sub - b.sub);
    for (let i = 0; i < answers.length; i += 1) {
      if (
        (payload.type === "text" &&
          answers[i]["answer"] ===
            room["questions"][room["current"].valueOf() - 1]["correct"] &&
          j < 3) ||
        payload.type === "number"
      ) {
        const index = players.findIndex(
          (obj: any) => obj.id === answers[i]["user"]
        );
        // console.log(players);
        players[index]["targetScore"] = 100 - j * 10;
        j++;

        correctPlayers.push({
          name: players[index]["name"],
        });
      }
      if (payload.type === "text") {
        if (answers[i]["answer"] == 1) answer1 += 1;
        if (answers[i]["answer"] == 2) answer2 += 1;
        if (answers[i]["answer"] == 3) answer3 += 1;
        if (answers[i]["answer"] == 4) answer4 += 1;
      }
    }
    await this.roomModel.updateOne(
      { _id: payload.roomId },
      { $set: { players: players } }
    );

    const correctAnswers =
      room["questions"][room["current"].valueOf() - 1]["answers"][correctIndex];
    await this.roomModel.updateOne(
      { _id: payload.roomId },
      { $set: { answers: [] } }
    );
    const indexUser = players.findIndex(
      (obj: any) => obj.id === payload.userId
    );
    const current: number = room["current"].valueOf();
    const question = room.questions[current];
    // for (let i = 0; i < players.length; i += 1) {
    //   // console.log(players[i]);
    //   players[i]["score"] = players[i]["score"] + players[i]["targetScore"];
    //   players[i]["targetScore"] = 0;
    //   // console.log(players[i]);
    //   // console.log("-------------------");
    // }
    players.sort(
      (a: any, b: any) => b.score + b.targetScore - (a.score + a.targetScore)
    );

    // console.log("--------------------------------");
    // console.log(players[indexUser]);
    if (payload.type === "text") {
      this.server.emit("toCorrect", {
        roomId: payload.roomId,
        allAnswers: players.length,
        answer1: answer1,
        answer2: answer2,
        answer3: answer3,
        answer4: answer4,
        finish: current === 10 ? true : false,

        correctAnswer: correctAnswers,
        correctPlayers: correctPlayers,
        targetScore: players[indexUser]["targetScore"],
        score: players[indexUser]["score"],
        userId: payload.userId,
        question: question,
        players: players,
        last: room["questions"][Math.max(current - 1, 0)],
      });
      // for (let i = 0; i < players.length; i += 1) {
      //   // console.log(players[i]);
      //   players[i]["score"] = players[i]["score"] + players[i]["targetScore"];
      //   players[i]["targetScore"] = 0;
      //   // console.log(players[i]);
      //   // console.log("-------------------");
      // }
    } else {
      this.server.emit("toCorrectNumber", {
        roomId: payload.roomId,
        allAnswers: answers,
        correctAnswer: correctAnswers,
        correctPlayers: correctPlayers,
        targetScore: players[indexUser]["targetScore"],
        score: players[indexUser]["score"],
        userId: payload.userId,
        players: players,
        finish: current === 10 ? true : false,

        last: room["questions"][Math.max(current - 1, 0)],
        question: question,
      });
    }
    await this.roomModel.updateOne(
      { _id: payload.roomId },
      { $set: { correct: false } }
    );
  }
  @SubscribeMessage("readyTimeOut")
  async handelReadyTimeout(client: Socket, payload: { roomId: string }) {
    await this.roomModel.updateOne(
      { _id: payload.roomId },
      { $set: { ready: 0 } }
    );
    this.server.emit("next", {
      roomId: payload.roomId,
    });
  }
}
