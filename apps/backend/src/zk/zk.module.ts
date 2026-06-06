import { Module } from '@nestjs/common';
import { ZkController } from './zk.controller';
import { ZkService } from './zk.service';

@Module({ controllers: [ZkController], providers: [ZkService], exports: [ZkService] })
export class ZkModule {}
