import { Test, TestingModule } from '@nestjs/testing';
import { ConsultantRatingController } from './consultant-rating.controller';
import { ConsultantRatingService } from './consultant-rating.service';

describe('ConsultantRatingController', () => {
  let controller: ConsultantRatingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultantRatingController],
      providers: [ConsultantRatingService],
    }).compile();

    controller = module.get<ConsultantRatingController>(ConsultantRatingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
