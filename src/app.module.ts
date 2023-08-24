import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SocketGateway } from "socket.gateway";
import { LoggerMiddleware } from "./Middleware/Logger";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { UserSchema } from "./models/user";
import { RoomSchema } from "./models/room";
import { QuestionModule } from "./question/question.module";
import { QuestionService } from "./question/question.service";

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([{ name: "user", schema: UserSchema }]),
    MongooseModule.forFeature([{ name: "room", schema: RoomSchema }]),

    MongooseModule.forRoot(
      "mongodb+srv://fahd:Fahdhakem123*@cluster0.gchoxor.mongodb.net/"
    ),

    QuestionModule, // Replace with your MongoDB connection string
    // userWaiting,
  ],
  controllers: [AppController],
  providers: [AppService, SocketGateway, QuestionService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
