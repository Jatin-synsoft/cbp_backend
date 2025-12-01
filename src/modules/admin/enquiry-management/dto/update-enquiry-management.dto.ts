import { PartialType } from '@nestjs/mapped-types';
import { CreateEnquiryManagementDto } from './create-enquiry-management.dto';

export class UpdateEnquiryManagementDto extends PartialType(CreateEnquiryManagementDto) {}
