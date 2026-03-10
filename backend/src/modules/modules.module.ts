import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { ModuleEnabledGuard } from './module-enabled.guard';
import { ModulesController } from './modules.controller';
import { ModuleRegistryBootstrapService } from './module-registry.bootstrap.service';
import { ModulesService } from './modules.service';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [ModulesController],
  providers: [ModulesService, ModuleRegistryBootstrapService, ModuleEnabledGuard],
  exports: [ModulesService, ModuleEnabledGuard],
})
export class ModulesModule {}
