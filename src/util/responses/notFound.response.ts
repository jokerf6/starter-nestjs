import { ApiProperty } from "@nestjs/swagger";
export class notFoundResponse {
  @ApiProperty()
  type: string;
  @ApiProperty()
  message: string;
}
