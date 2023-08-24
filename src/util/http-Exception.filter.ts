import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
  } from "@nestjs/common";
  import { Response } from "express";
  import { ResponseController } from "./response.controller";
  
  @Catch()
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      if (exception instanceof HttpException) {
        const exceptionResponse = exception.getResponse();
        const code = exceptionResponse["statusCode"];
        const message = exceptionResponse["message"];
        console.log(exceptionResponse);
        switch (code) {
          case 400:
            ResponseController.badRequest(response, "ValidationErr", message);
            break;
          case 403:
            ResponseController.forbidden(
              response,
              "You don't have enough permissions to access these resources"
            );
            break;
          case 401:
            ResponseController.unauthorized(response);
            break;
          case 200:
            ResponseController.success(
              response,
              message,
              exceptionResponse["data"]
            );
            break;
          default:
            ResponseController.internalServerError(response);
        }
      } else {
        console.log(exception);
        ResponseController.internalServerError(response);
      }
    }
  }