import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestMeta = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
};

export const CurrentRequestMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestMeta => {
    const request = ctx.switchToHttp().getRequest<{
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
      socket?: { remoteAddress?: string };
    }>();

    return {
      ip: request.ip || request.socket?.remoteAddress,
      headers: request.headers,
    };
  },
);
