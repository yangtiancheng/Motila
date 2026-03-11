import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BatchDeleteUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];
}
