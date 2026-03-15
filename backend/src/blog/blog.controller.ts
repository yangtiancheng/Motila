import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { ModuleEnabledGuard } from '../modules/module-enabled.guard';
import { RequireModule, RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import {
  BatchDeleteBlogCategoriesDto,
  BatchDeleteBlogPostsDto,
  CreateBlogCategoryDto,
  CreateBlogPostDto,
  ListBlogCategoriesQueryDto,
  ListBlogPostsQueryDto,
  UpdateBlogCategoryDto,
  UpdateBlogPostDto,
} from './dto/blog.dto';
import { BlogService } from './blog.service';

@Controller('blog')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('categories')
  @RequirePermission('blog-category.read')
  listCategories(@Query() query: ListBlogCategoriesQueryDto) {
    return this.blogService.listCategories(query);
  }

  @Get('categories/:id')
  @RequirePermission('blog-category.read')
  getCategory(@Param('id') id: string) {
    return this.blogService.getCategory(id);
  }

  @Post('categories')
  @RequirePermission('blog-category.create')
  createCategory(@Body() dto: CreateBlogCategoryDto) {
    return this.blogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @RequirePermission('blog-category.update')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.blogService.updateCategory(id, dto);
  }

  @Delete('categories/batch-delete')
  @RequirePermission('blog-category.update')
  deleteCategories(@Body() dto: BatchDeleteBlogCategoriesDto) {
    return this.blogService.deleteCategories(dto.ids);
  }

  @Get('posts')
  @RequirePermission('blog-post.read')
  listPosts(@Query() query: ListBlogPostsQueryDto) {
    return this.blogService.listPosts(query);
  }

  @Get('posts/:id')
  @RequirePermission('blog-post.read')
  getPost(@Param('id') id: string) {
    return this.blogService.getPost(id);
  }

  @Post('posts')
  @RequirePermission('blog-post.create')
  createPost(@Body() dto: CreateBlogPostDto) {
    return this.blogService.createPost(dto);
  }

  @Patch('posts/:id')
  @RequirePermission('blog-post.update')
  updatePost(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.updatePost(id, dto);
  }

  @Delete('posts/batch-delete')
  @RequirePermission('blog-post.update')
  deletePosts(@Body() dto: BatchDeleteBlogPostsDto) {
    return this.blogService.deletePosts(dto.ids);
  }
}

@Controller('public/blog')
export class PublicBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('categories')
  listCategories() {
    return this.blogService.listPublicCategories();
  }

  @Get('posts')
  listPosts(@Query() query: ListBlogPostsQueryDto) {
    return this.blogService.listPublicPosts(query);
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    return this.blogService.getPublicPost(id);
  }
}
