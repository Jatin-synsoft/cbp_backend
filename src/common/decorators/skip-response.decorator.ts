import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_KEY = 'skipResponse';
export const SkipResponse = () => SetMetadata(SKIP_RESPONSE_KEY, true);
