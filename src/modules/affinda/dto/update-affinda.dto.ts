import { PartialType } from '@nestjs/mapped-types';
import { CreateAffindaDto } from './create-affinda.dto';

export class UpdateAffindaDto extends PartialType(CreateAffindaDto) {}
