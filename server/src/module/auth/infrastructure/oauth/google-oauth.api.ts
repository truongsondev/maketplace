import express, { Request, Response } from 'express';
import { asyncHandler } from '@/shared/server/error-middleware';
import { ResponseFormatter } from '@/shared/server/api-response';
import { BadRequestError } from '@/error-handlling/badRequestError';
import { createLogger } from '@/shared/util/logger';
import { AuthController } from '../../interface-adapter/controller/auth.controller';
import { registerGooglePassportStrategy, passport } from './google-passport';
import { redis } from '@/infrastructure/database';

const logger = createLogger('GoogleOAuthAPI');

type GoogleProfile = {
  id: string;
  emails?: Array<{ value: string }>;
};

export class GoogleOAuthAPI {
  readonly router = express.Router();

  constructor(private readonly authController: AuthController) {
    this.router.use(passport.initialize());
    this.initializePassport();
    this.initializeRoutes();
  }

  private initializePassport() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !callbackUrl) {
      logger.warn('Google OAuth env vars missing; endpoints will error', {
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
        hasCallbackUrl: Boolean(callbackUrl),
      });
      return;
    }

    registerGooglePassportStrategy({
      clientId,
      clientSecret,
      callbackUrl,
    });
  }

  private initializeRoutes(): void {
    this.router.get('/google', asyncHandler(this.start.bind(this)));
    this.router.get(
      '/google/callback',
      passport.authenticate('google', {
        session: false,
        failureRedirect: process.env.GOOGLE_FAILURE_REDIRECT ?? undefined,
      }),
      asyncHandler(this.callback.bind(this)),
    );

    this.router.post('/google/exchange', asyncHandler(this.exchange.bind(this)));
  }

  private async start(req: Request, res: Response): Promise<void> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new BadRequestError('Google OAuth is not configured');
    }

    const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : undefined;
    const state = redirect
      ? Buffer.from(JSON.stringify({ redirect })).toString('base64')
      : undefined;

    const authenticator = passport.authenticate('google', {
      session: false,
      scope: ['profile', 'email'],
      state,
      prompt: 'select_account',
    });

    authenticator(req, res);
  }

  private async callback(req: Request, res: Response): Promise<void> {
    const profile = req.user as GoogleProfile | undefined;

    const providerUserId = profile?.id;
    const email = profile?.emails?.[0]?.value;

    if (!providerUserId || !email) {
      throw new BadRequestError('Google profile missing required fields');
    }

    const deviceInfo = (req.headers['user-agent'] ?? 'unknown').toString().slice(0, 500);
    const result = await this.authController.googleOAuthLogin({
      providerUserId,
      email,
      deviceInfo,
    });

    const code = this.generateCode();
    const codeKey = `oauth:google:code:${code}`;
    const ttlSeconds = Number(process.env.GOOGLE_OAUTH_CODE_TTL_SECONDS ?? 60);

    await redis.setex(codeKey, ttlSeconds > 0 ? ttlSeconds : 60, JSON.stringify(result));

    const rawState = typeof req.query.state === 'string' ? req.query.state : undefined;

    // Redirect to frontend callback with one-time code (avoid tokens in URL)
    const frontendBase = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const callbackPath = '/auth/google/callback';
    const url = new URL(callbackPath, frontendBase);

    if (rawState) {
      try {
        const parsed = JSON.parse(Buffer.from(rawState, 'base64').toString('utf8')) as {
          redirect?: string;
        };
        if (parsed.redirect) {
          url.searchParams.set('redirect', parsed.redirect);
        }
      } catch {
        // ignore
      }
    }

    url.searchParams.set('code', code);

    res.redirect(url.toString());
  }

  private async exchange(req: Request, res: Response): Promise<void> {
    const { code } = req.body as { code?: string };

    if (!code || typeof code !== 'string') {
      throw new BadRequestError('Code is required');
    }

    const codeKey = `oauth:google:code:${code}`;
    const payload = await redis.get(codeKey);
    if (!payload) {
      throw new BadRequestError('Code is invalid or expired');
    }

    // One-time: delete after read
    await redis.del(codeKey);

    const parsed = JSON.parse(payload);
    const response = ResponseFormatter.success(parsed, 'Google login successful');
    res.status(200).json(response);
  }

  private generateCode(): string {
    // 32 chars alnum
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < 32; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }
}
