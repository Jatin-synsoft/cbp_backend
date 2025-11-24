import { Test, TestingModule } from '@nestjs/testing';
import { ConsultantRatingService } from './consultant-rating.service';

describe('ConsultantRatingService', () => {
  let service: ConsultantRatingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultantRatingService],
    }).compile();

    service = module.get<ConsultantRatingService>(ConsultantRatingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
