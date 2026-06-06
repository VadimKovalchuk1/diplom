// AuditInterceptor автоматически фиксирует факт вызова API после успешной обработки.
// Это cross-cutting concern: логика нужна почти всем endpoint'ам, поэтому она вынесена
// в interceptor, а не копируется вручную в каждый controller.
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method: string; url: string; user?: { sub: string } }>();
    const startedAt = Date.now();

    // next.handle() запускает реальный controller. tap выполнится после успешного ответа.
    return next.handle().pipe(
      tap(() => this.audit.recordAccess({ actorId: request.user?.sub ?? 'anonymous', action: `${request.method} ${request.url}`, durationMs: Date.now() - startedAt }))
    );
  }
}
