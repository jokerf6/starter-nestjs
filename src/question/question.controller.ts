import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from "@nestjs/common";
import { QuestionService } from "./question.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("question")
@Controller("question")
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get("/")
  findAll() {
    return this.questionService.findAll();
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.questionService.remove(+id);
  }
}
