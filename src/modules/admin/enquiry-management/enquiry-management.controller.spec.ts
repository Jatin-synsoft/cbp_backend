import { Test, TestingModule } from '@nestjs/testing';
import { EnquiryManagementController } from './enquiry-management.controller';
import { EnquiryManagementService } from './enquiry-management.service';

describe('EnquiryManagementController', () => {
  let controller: EnquiryManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnquiryManagementController],
      providers: [EnquiryManagementService],
    }).compile();

    controller = module.get<EnquiryManagementController>(EnquiryManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
