import { INestApplication } from "@nestjs/common";
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerDocumentOptions,
} from "@nestjs/swagger";
import { badRequestResponse } from "./responses/badRequest.response";
import { conflictResponse } from "./responses/conflict.response";
import { notFoundResponse } from "./responses/notFound.response";
import { OkResponse } from "./responses/okResponse.response";
export class SwaggerInit {
  static init(app: INestApplication) {
    const config = new DocumentBuilder()
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
        },
        "Access Token"
      )
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
        },
        "Refresh Token"
      )
      .setTitle("Jobber")
      .setDescription("")
      .setVersion("1.0")
      .build();
    const options: SwaggerDocumentOptions = {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
      extraModels: [
        conflictResponse,
        notFoundResponse,
        OkResponse,
        badRequestResponse,
      ],
    };
    const document = SwaggerModule.createDocument(app, config, options);
    SwaggerModule.setup("api/v1/docs", app, document);
  }
}