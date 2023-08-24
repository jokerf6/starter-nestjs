import { Injectable, Res } from "@nestjs/common";
import { ResponseController } from "src/util/response.controller";
import { UserModule } from "./user.module";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserStatus } from "src/models/user";
import { Room } from "src/models/room";

@Injectable()
export class UserService {
  constructor(
    @InjectModel("user") private readonly userModel: Model<User>,
    @InjectModel("room") private readonly roomModel: Model<Room>
  ) {}
  async createUser(req, res, createUserDto) {
    const { name } = createUserDto;
    const createdUser = new this.userModel({ name, status: UserStatus.wait });
    const result = await createdUser.save();
    const x = createdUser._id.toString().split("(")[0];
    console.log(x);
    return ResponseController.success(res, "create data Successfully", null);
  }
  async getUsers(req, res, id) {
    const all = await this.roomModel.find({ _id: id });
    return ResponseController.success(res, "data get Successfully", all);
  }
  //  async deleteUser(req , res , id){
  //   await this.userModel
  //  }
}
