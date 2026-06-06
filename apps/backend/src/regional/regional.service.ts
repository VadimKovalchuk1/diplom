// RegionalService моделирует межрегиональный документооборот между палатами.
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface RegionalRequest { id: string; documentId: string; fromChamber: string; toChamber: string; status: 'CREATED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'; createdAt: string; }

@Injectable()
export class RegionalService {
  private readonly requests: RegionalRequest[] = [];

  // Создание запроса: документ направляется из одной региональной палаты в другую.
  create(input: Omit<RegionalRequest, 'id' | 'status' | 'createdAt'>): RegionalRequest {
    const request = { ...input, id: randomUUID(), status: 'CREATED' as const, createdAt: new Date().toISOString() };
    this.requests.push(request);
    return request;
  }

  list(): RegionalRequest[] { return this.requests; }
}
