import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(NotFoundException)
export class HtmlNotFoundFilter implements ExceptionFilter {
  catch(_exception: NotFoundException, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(HttpStatus.NOT_FOUND).render('not-found');
  }
}
