import { HttpException, HttpStatus } from '@nestjs/common';

export class StockUnderflowException extends HttpException {
  constructor(message: string = 'Insufficient stock for operation', details?: any) {
    super(
      {
        code: 'STOCK_UNDERFLOW',
        message,
        details: details || {},
      },
      HttpStatus.CONFLICT,
    );
  }
}
