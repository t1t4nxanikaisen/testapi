import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import { rateLimiter } from 'hono-rate-limiter';
import { swaggerUI } from '@hono/swagger-ui';

import hiAnimeRoutes from './routes/routes.js';
import { AppError } from './utils/errors.js';
import { fail } from './utils/response.js';
import hianimeApiDocs from './utils/swaggerUi.js';
import { logger } from 'hono/logger';

// Import fetchAnimeData and generateVidNestUrl
import fetchAnimeData from './fetchAnimeData.js';
import generateVidNestUrl from './generateVidNestUrl.js';

const app = new Hono();
config();

const origins = process.env.ORIGIN ? process.env.ORIGIN.split(',') : '*';

// Third party middlewares
app.use(
  '*',
  cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: '*',
  })
);

// Apply the rate limiting middleware to all requests
app.use(
  rateLimiter({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
    limit: process.env.RATE_LIMIT_LIMIT || 100,
    standardHeaders: 'draft-6',
    keyGenerator: () => '<unique_key>',
  })
);

// Middleware
app.use('/api/v1/*', logger());

// Routes
app.get('/', (c) => {
  c.status(200);
  return c.text('Welcome To the Anikaisen API 🎉 get started with /api/v1');
});

app.get('/ping', (c) => {
  return c.text('pong');
});

// Main API routes
app.route('/api/v1', hiAnimeRoutes);

// Swagger docs
app.get('/doc', (c) => c.json(hianimeApiDocs));
app.get('/ui', swaggerUI({ url: '/doc' }));

// New route: fetch anime via slug and generate VidNest URL
app.get('/anime/:slug/episode/:episodeNumber', async (c) => {
  try {
    const { slug, episodeNumber } = c.req.param();
    const animeData = await fetchAnimeData(slug);

    if (!animeData) {
      return c.json({ error: 'Anime not found' }, 404);
    }

    const vidNestUrl = generateVidNestUrl(animeData.id, episodeNumber);

    return c.json({
      animeTitle: animeData.title.romaji || animeData.title.english,
      anilistId: animeData.id,
      episode: episodeNumber,
      vidNestUrl,
    });
  } catch (err) {
    console.error('Error fetching anime:', err);
    return fail(c, err.message || 'Unexpected error');
  }
});

// Global error handling
app.onError((err, c) => {
  if (err instanceof AppError) {
    return fail(c, err.message, err.statusCode, err.details);
  }
  console.error('Unexpected Error:', err.message);
  return fail(c);
});

export default app;
