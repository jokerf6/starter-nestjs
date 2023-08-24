import {
  Controller,
  Get,
  Post,
  Res,
  Param,
  Query,
  Patch,
  Req,
  ValidationPipe,
  Body,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { ApiTags } from "@nestjs/swagger";
import { createUserDto } from "./dto/createUser.dto";

@Controller("user")
@ApiTags("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @ApiBasicAuth("Access Token")
  // @UseGuards(AuthGuard("jwt"))

  @Post("/")
  async createUser(
    @Req() req,
    @Res() res,
    @Body(ValidationPipe) createUserDto: createUserDto
  ) {
    console.log("///////////");
    return this.userService.createUser(req, res, createUserDto);
  }
  @Get("/:id")
  async getUsers(@Req() req, @Res() res, @Param("id") id: string) {
    return this.userService.getUsers(req, res, id);
  }
  // @Delete("/:id")
  // async deleteUser(@Req() req, @Res() res, @Param("id") id: string) {
  //   return this.userService.deleteUser(req, res, id);
  // }
}
