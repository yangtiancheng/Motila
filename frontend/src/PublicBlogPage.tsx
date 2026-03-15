import {
  App as AntdApp,
  Avatar,
  Button,
  Empty,
  Input,
  Pagination,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { SearchOutlined, ArrowRightOutlined, CalendarOutlined, ReadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';

import './LandingPage.css';

type PublicBlogPageProps = {
  systemTitle: string;
  primaryColor: string;
  footerText: string;
  onStart: () => void;
  onBackHome: () => void;
};

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
};

type PostItem = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  contentMd?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: CategoryItem | null;
};

type ListPostsResponse = {
  data: PostItem[];
  total: number;
  page: number;
  pageSize: number;
};

const API_BASE = '/api';

async function blogApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `请求失败: ${response.status}`);
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

function parseBlogError(error: unknown): string {
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) return parsed.message.join('；');
      if (typeof parsed.message === 'string') return parsed.message;
    } catch {
      return error.message;
    }
    return error.message;
  }
  return '加载失败';
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  return search.toString();
}

function renderFooterContent(text: string) {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <a key={`${match[2]}-${match.index}`} href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </a>,
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length > 0 ? nodes : text;
}

function markdownToHtml(markdown?: string | null) {
  if (!markdown?.trim()) return '<p>暂无内容。</p>';

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const inline = (value: string) =>
    escapeHtml(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let inList = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${inline(paragraph.join('<br />'))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (inList) {
      blocks.push('</ul>');
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      if (!inList) {
        blocks.push('<ul>');
        inList = true;
      }
      blocks.push(`<li>${inline(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    closeList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  closeList();

  return blocks.join('');
}

function estimateReadMinutes(content?: string | null) {
  const plain = (content || '').replace(/[#>*`\-\[\]()]/g, ' ');
  const count = plain.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(count / 220) || 1);
}

function extractExcerpt(content?: string | null, summary?: string | null) {
  if (summary?.trim()) return summary.trim();
  return (content || '').replace(/[#>*`\-\[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140) || '这篇文章暂时还没有摘要。';
}

export function PublicBlogPage({ systemTitle, primaryColor, footerText, onStart, onBackHome }: PublicBlogPageProps) {
  const { message } = AntdApp.useApp();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activePost, setActivePost] = useState<PostItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    blogApi<CategoryItem[]>('/public/blog/categories')
      .then((data) => setCategories(data))
      .catch((error) => message.error(parseBlogError(error)));
  }, [message]);

  useEffect(() => {
    const query = buildQuery({
      page,
      pageSize,
      categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
      keyword: keyword || undefined,
    });

    setLoading(true);
    blogApi<ListPostsResponse>(`/public/blog/posts?${query}`)
      .then((res) => {
        setPosts(res.data);
        setTotal(res.total);
        if (res.data.length > 0) {
          const nextId = activePost && res.data.some((item) => item.id === activePost.id) ? activePost.id : res.data[0].id;
          setDetailLoading(true);
          blogApi<PostItem>(`/public/blog/posts/${nextId}`)
            .then((detail) => setActivePost(detail))
            .catch((error) => message.error(parseBlogError(error)))
            .finally(() => setDetailLoading(false));
        } else {
          setActivePost(null);
        }
      })
      .catch((error) => message.error(parseBlogError(error)))
      .finally(() => setLoading(false));
  }, [activePost, keyword, message, page, pageSize, selectedCategoryId]);

  const featuredPost = posts[0] ?? null;
  const heroSummary = useMemo(() => extractExcerpt(featuredPost?.contentMd, featuredPost?.summary), [featuredPost]);

  const openDetail = async (postId: string) => {
    setDetailLoading(true);
    try {
      const detail = await blogApi<PostItem>(`/public/blog/posts/${postId}`);
      setActivePost(detail);
      const section = document.getElementById('blog-detail-anchor');
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      message.error(parseBlogError(error));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="landing-page landing-blog-page" style={{ ['--landing-primary' as string]: primaryColor }}>
      <div className="landing-backdrop landing-backdrop-a" />
      <div className="landing-backdrop landing-backdrop-b" />
      <div className="landing-backdrop landing-backdrop-c" />
      <div className="landing-backdrop landing-backdrop-d" />
      <div className="landing-backdrop landing-backdrop-e" />

      <div className="landing-container">
        <header className="landing-header landing-header-glass">
          <div>
            <Typography.Text className="landing-kicker">MOTILA BLOG</Typography.Text>
            <Typography.Title level={2} className="landing-brand-heading">
              {systemTitle}
            </Typography.Title>
          </div>

          <nav className="landing-nav">
            <button type="button" onClick={onBackHome}>首页</button>
            <button type="button" onClick={() => document.getElementById('blog-list-anchor')?.scrollIntoView({ behavior: 'smooth' })}>博文</button>
            <button type="button" onClick={() => document.getElementById('blog-detail-anchor')?.scrollIntoView({ behavior: 'smooth' })}>详情</button>
            <button type="button" onClick={onStart}>登录后台</button>
          </nav>

          <Button size="large" type="primary" onClick={onStart}>
            进入系统
          </Button>
        </header>

        <section className="landing-blog-hero">
          <div className="landing-blog-hero-copy">
            <Typography.Text className="landing-kicker">公开博客 · 不登录也能看</Typography.Text>
            <Typography.Title className="landing-blog-title">
              博文单独成页，首页不掺和，阅读体验也更像样。
            </Typography.Title>
            <Typography.Paragraph className="landing-blog-subtitle">
              支持按博客分类筛选、关键词搜索、分页浏览和沉浸式详情阅读。首页只做品牌入口，博客内容集中放在独立页面，结构更清楚。
            </Typography.Paragraph>
            <Space wrap>
              <Button type="primary" size="large" icon={<ReadOutlined />} onClick={() => document.getElementById('blog-list-anchor')?.scrollIntoView({ behavior: 'smooth' })}>
                开始阅读
              </Button>
              <Button size="large" onClick={onBackHome}>返回首页</Button>
            </Space>
          </div>

          <div className="landing-blog-featured-card">
            {featuredPost ? (
              <>
                <div className="landing-blog-featured-meta">
                  <Tag color="blue">{featuredPost.category?.name || '未分类'}</Tag>
                  <span>{featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString() : '未设置发布时间'}</span>
                </div>
                <Typography.Title level={3}>{featuredPost.title}</Typography.Title>
                <Typography.Paragraph>{heroSummary}</Typography.Paragraph>
                <div className="landing-blog-featured-footer">
                  <div className="landing-blog-authorish">
                    <Avatar size={40}>{systemTitle.slice(0, 1)}</Avatar>
                    <div>
                      <strong>{systemTitle}</strong>
                      <span>{estimateReadMinutes(featuredPost.contentMd)} 分钟阅读</span>
                    </div>
                  </div>
                  <Button type="link" icon={<ArrowRightOutlined />} onClick={() => void openDetail(featuredPost.id)}>
                    阅读全文
                  </Button>
                </div>
              </>
            ) : (
              <Empty description="还没有已发布的博客文章" />
            )}
          </div>
        </section>

        <section id="blog-list-anchor" className="landing-blog-toolbar-card">
          <div className="landing-blog-toolbar-top">
            <div>
              <Typography.Title level={3}>博客文章</Typography.Title>
              <Typography.Paragraph>分类筛选、搜索和分页都在这，不再往首页乱塞内容。</Typography.Paragraph>
            </div>
            <Input
              className="landing-blog-search"
              placeholder="搜索标题、摘要、内容关键词"
              prefix={<SearchOutlined />}
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onPressEnter={() => {
                setPage(1);
                setKeyword(keywordInput.trim());
              }}
              suffix={
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setPage(1);
                    setKeyword(keywordInput.trim());
                  }}
                >
                  搜索
                </Button>
              }
            />
          </div>

          <div className="landing-blog-filter-row">
            <button
              type="button"
              className={selectedCategoryId === 'all' ? 'active' : ''}
              onClick={() => {
                setSelectedCategoryId('all');
                setPage(1);
              }}
            >
              全部分类
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={selectedCategoryId === category.id ? 'active' : ''}
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setPage(1);
                }}
              >
                {category.name}
                {typeof category.postCount === 'number' ? <span>{category.postCount}</span> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="landing-blog-grid">
          {loading ? Array.from({ length: 6 }).map((_, idx) => <Skeleton.Button active block key={idx} style={{ height: 240 }} />) : null}
          {!loading && posts.length === 0 ? <Empty className="landing-blog-empty" description="没有匹配的博客文章" /> : null}
          {!loading && posts.map((post) => (
            <article key={post.id} className="landing-blog-card" onClick={() => void openDetail(post.id)}>
              <div className="landing-blog-card-top">
                <Tag color="blue">{post.category?.name || '未分类'}</Tag>
                <span><CalendarOutlined /> {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '未发布'}</span>
              </div>
              <Typography.Title level={4}>{post.title}</Typography.Title>
              <Typography.Paragraph>{extractExcerpt(post.contentMd, post.summary)}</Typography.Paragraph>
              <div className="landing-blog-card-footer">
                <span>{estimateReadMinutes(post.contentMd)} 分钟阅读</span>
                <Button type="link" onClick={(event) => { event.stopPropagation(); void openDetail(post.id); }}>
                  查看详情
                </Button>
              </div>
            </article>
          ))}
        </section>

        <div className="landing-blog-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onChange={(nextPage) => setPage(nextPage)}
          />
        </div>

        <section id="blog-detail-anchor" className="landing-blog-detail-shell">
          {detailLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : activePost ? (
            <>
              <div className="landing-blog-detail-head">
                <Space wrap>
                  <Tag color="geekblue">{activePost.category?.name || '未分类'}</Tag>
                  <Typography.Text type="secondary">{activePost.publishedAt ? new Date(activePost.publishedAt).toLocaleString() : '未设置发布时间'}</Typography.Text>
                  <Typography.Text type="secondary">{estimateReadMinutes(activePost.contentMd)} 分钟阅读</Typography.Text>
                </Space>
                <Typography.Title>{activePost.title}</Typography.Title>
                <Typography.Paragraph className="landing-blog-detail-summary">
                  {extractExcerpt(activePost.contentMd, activePost.summary)}
                </Typography.Paragraph>
              </div>

              <div className="landing-blog-prose" dangerouslySetInnerHTML={{ __html: markdownToHtml(activePost.contentMd) }} />
            </>
          ) : (
            <Empty description="请选择一篇文章开始阅读" />
          )}
        </section>

        <footer className="landing-footer landing-footer-plain landing-footer-rich">
          <Typography.Text>{renderFooterContent(footerText)}</Typography.Text>
        </footer>
      </div>
    </div>
  );
}
