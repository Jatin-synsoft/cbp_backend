import { Test, TestingModule } from '@nestjs/testing';
import { AffindaService } from './affinda.service';

describe('AffindaService', () => {
  let service: AffindaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AffindaService],
    }).compile();

    service = module.get<AffindaService>(AffindaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
