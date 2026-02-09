import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidStateTransitionException extends HttpException {
  constructor(message: string = 'Invalid state transition', details?: any) {
    super(
      {
        code: 'INVALID_STATE_TRANSITION',
        message,
        details: details || {},
      },
      HttpStatus.CONFLICT,
    );
  }
}
