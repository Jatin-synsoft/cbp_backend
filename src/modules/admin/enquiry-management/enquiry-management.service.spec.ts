import { Test, TestingModule } from '@nestjs/testing';
import { EnquiryManagementService } from './enquiry-management.service';

describe('EnquiryManagementService', () => {
  let service: EnquiryManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnquiryManagementService],
    }).compile();

    service = module.get<EnquiryManagementService>(EnquiryManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
