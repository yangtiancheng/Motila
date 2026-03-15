import { Module } from '@nestjs/common';
import { ModulesModule } from '../modules/modules.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { BlogController, PublicBlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [PrismaModule, RbacModule, ModulesModule],
  controllers: [BlogController, PublicBlogController],
  providers: [BlogService],
})
export class BlogModule {}
