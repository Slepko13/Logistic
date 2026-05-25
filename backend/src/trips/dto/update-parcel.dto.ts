import { PartialType } from '@nestjs/swagger';
import { CreateParcelDto } from './create-parcel.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateParcelDto extends PartialType(CreateParcelDto) {
  @IsOptional()
  @IsBoolean()
  is_delivered?: boolean;
}
