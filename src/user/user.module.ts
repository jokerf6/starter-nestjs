import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema } from "src/models/user";
import { RoomSchema } from "src/models/room";
@Module({
  imports: [
    MongooseModule.forFeature([{ name: "user", schema: UserSchema }]),
    MongooseModule.forFeature([{ name: "room", schema: RoomSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
