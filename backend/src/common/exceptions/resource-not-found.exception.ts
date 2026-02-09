import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier: string) {
    super(
      {
        code: 'RESOURCE_NOT_FOUND',
        message: `${resource} with identifier ${identifier} not found`,
        details: { resource, identifier },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
