import { Controller, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";

@Controller()
export class ResponseController {
  static success(@Res() res: Response, message: string, data: object = {}) {
    res.status(HttpStatus.OK).json({ type: "Success", message, data });
  }
  static created(@Res() res: Response, message: string, data: object = {}) {
    res.status(HttpStatus.CREATED).json({ type: "Created", message, data });
  }
  static forbidden(@Res() res: Response, message: string) {
    return res
      .status(HttpStatus.FORBIDDEN)
      .json({ type: "Forbidden", message });
  }
  static conflict(
    @Res() res: Response,
    message: string,
    data: object = {},
    type = "Conflict"
  ) {
    return res.status(HttpStatus.CONFLICT).json({ type, message, data });
  }
  static notFound(@Res() res: Response, message: string) {
    return res.status(HttpStatus.NOT_FOUND).json({ type: "NotFound", message });
  }
  static internalServerError(@Res() res: Response) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      type: "InternalServerError",
      message: "An error occured on the server, Please try again later.",
    });
  }
  static unauthorized(@Res() res: Response) {
    res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ type: "Unauthorized", message: "Unauthorized" });
  }
  static badRequest(@Res() res: Response, type: string, message: string) {
    return res.status(HttpStatus.BAD_REQUEST).json({ type, message });
  }
}