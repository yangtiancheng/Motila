import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBlogCategoryDto,
  CreateBlogPostDto,
  ListBlogCategoriesQueryDto,
  ListBlogPostsQueryDto,
  UpdateBlogCategoryDto,
  UpdateBlogPostDto,
} from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(query: ListBlogCategoriesQueryDto) {
    const page = query.page ?? 1;
    const rawPageSize = query.pageSize ?? 10;
    const pageSize = rawPageSize === 0 ? 1000 : rawPageSize;
    const skip = (page - 1) * pageSize;
    const where = query.keyword
      ? {
          OR: [
            { name: { contains: query.keyword } },
            { slug: { contains: query.keyword } },
            { description: { contains: query.keyword } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.blogCategory.findMany({ where, orderBy: { createdAt: 'desc' }, skip: rawPageSize === 0 ? 0 : skip, take: rawPageSize === 0 ? undefined : pageSize }),
      this.prisma.blogCategory.count({ where }),
    ]);

    return { data, total, page, pageSize: rawPageSize };
  }

  async getCategory(id: string) {
    const found = await this.prisma.blogCategory.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('文章分类不存在');
    return found;
  }

  async createCategory(dto: CreateBlogCategoryDto) {
    const slug = (dto.slug?.trim() || dto.name.trim()).toLowerCase().replace(/\s+/g, '-');
    const exists = await this.prisma.blogCategory.findUnique({ where: { slug } });
    if (exists) throw new ConflictException('分类标识已存在');
    return this.prisma.blogCategory.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateBlogCategoryDto) {
    await this.getCategory(id);
    const nextSlug = dto.slug?.trim().toLowerCase().replace(/\s+/g, '-');
    if (nextSlug) {
      const duplicated = await this.prisma.blogCategory.findFirst({ where: { slug: nextSlug, NOT: { id } } });
      if (duplicated) throw new ConflictException('分类标识已存在');
    }
    return this.prisma.blogCategory.update({
      where: { id },
      data: {
        name: dto.name,
        slug: nextSlug,
        description: dto.description,
      },
    });
  }

  async deleteCategories(ids: string[]) {
    await this.prisma.blogPost.updateMany({ where: { categoryId: { in: ids } }, data: { categoryId: null } });
    const result = await this.prisma.blogCategory.deleteMany({ where: { id: { in: ids } } });
    return { count: result.count };
  }

  async listPosts(query: ListBlogPostsQueryDto) {
    const page = query.page ?? 1;
    const rawPageSize = query.pageSize ?? 10;
    const pageSize = rawPageSize === 0 ? 1000 : rawPageSize;
    const skip = (page - 1) * pageSize;
    const where = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.keyword
        ? {
            OR: [
              { title: { contains: query.keyword } },
              { slug: { contains: query.keyword } },
              { summary: { contains: query.keyword } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: rawPageSize === 0 ? 0 : skip,
        take: rawPageSize === 0 ? undefined : pageSize,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { data, total, page, pageSize: rawPageSize };
  }

  async getPost(id: string) {
    const found = await this.prisma.blogPost.findUnique({ where: { id }, include: { category: true } });
    if (!found) throw new NotFoundException('文章不存在');
    return found;
  }

  async createPost(dto: CreateBlogPostDto) {
    const slug = (dto.slug?.trim() || dto.title.trim()).toLowerCase().replace(/\s+/g, '-');
    const exists = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (exists) throw new ConflictException('文章标识已存在');
    if (dto.categoryId) await this.getCategory(dto.categoryId);
    return this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        contentMd: dto.contentMd,
        categoryId: dto.categoryId,
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.isPublished ? new Date() : null,
      },
      include: { category: true },
    });
  }

  async updatePost(id: string, dto: UpdateBlogPostDto) {
    const current = await this.getPost(id);
    const nextSlug = dto.slug?.trim().toLowerCase().replace(/\s+/g, '-');
    if (nextSlug) {
      const duplicated = await this.prisma.blogPost.findFirst({ where: { slug: nextSlug, NOT: { id } } });
      if (duplicated) throw new ConflictException('文章标识已存在');
    }
    if (dto.categoryId) await this.getCategory(dto.categoryId);

    const nextPublished = dto.isPublished ?? current.isPublished;
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        title: dto.title,
        slug: nextSlug,
        summary: dto.summary,
        contentMd: dto.contentMd,
        categoryId: dto.categoryId === null ? null : dto.categoryId,
        isPublished: dto.isPublished,
        publishedAt: nextPublished ? current.publishedAt ?? new Date() : null,
      },
      include: { category: true },
    });
  }

  async deletePosts(ids: string[]) {
    const result = await this.prisma.blogPost.deleteMany({ where: { id: { in: ids } } });
    return { count: result.count };
  }
}
