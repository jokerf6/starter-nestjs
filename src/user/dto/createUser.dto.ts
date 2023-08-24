import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
  IsUrl,
} from "class-validator";

export class createUserDto {
  @ApiProperty()
  name: string;
}
