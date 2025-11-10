import { Test, TestingModule } from '@nestjs/testing';
import { AffindaController } from './affinda.controller';
import { AffindaService } from './affinda.service';

describe('AffindaController', () => {
  let controller: AffindaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffindaController],
      providers: [AffindaService],
    }).compile();

    controller = module.get<AffindaController>(AffindaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
