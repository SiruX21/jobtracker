# Redis Logo Caching Implementation

## Overview

This implementation adds Redis caching for company logos to reduce API requests to Logo.dev and improve performance.

## Architecture

### Backend Components

1. **Redis Service** (`redis:7-alpine`)
   - Persistent data storage with appendonly mode
   - Accessible on port 6379
   - Data persisted in `redis_data` volume

2. **Logo Cache Service** (`/backend/app/services/logo_cache_service.py`)
   - Manages Redis connections and caching logic
   - Generates and validates logo URLs
   - Handles cache TTL (7 days default)
   - Provides alternative domain suggestions

3. **Logo API Routes** (`/backend/app/routes/logos.py`)
   - `/api/logos/company/<name>` - Get single company logo
   - `/api/logos/batch` - Get multiple logos in one request
   - `/api/logos/validate/<name>` - Get and validate logo URL
   - `/api/logos/cache/clear` - Clear cache (admin)
   - `/api/logos/cache/stats` - Cache statistics
   - `/api/logos/health` - Service health check

### Frontend Components

1. **Logo Service** (`/front-end/src/services/logoService.js`)
   - Frontend memory caching layer
   - Handles API communication with backend
   - Batching requests for multiple logos
   - Fallback logo generation
   - Prevents duplicate requests

2. **Updated Components**
   - `companySuggestions.jsx` - Async logo loading
   - `TrackerPage.jsx` - Uses cached logo service
   - Preloads logos for all job companies

## Cache Strategy

### Multi-Level Caching

1. **Frontend Memory Cache**
   - Immediate logo availability
   - Prevents duplicate API calls
   - Cleared on page refresh

2. **Redis Backend Cache**
   - Persistent across server restarts
   - 7-day TTL for logo URLs
   - Shared across all users

3. **Logo.dev API**
   - Final fallback when not cached
   - Results are cached for future use

### Cache Flow

```
1. User requests logo for "Google"
2. Frontend checks memory cache → Miss
3. Frontend calls backend API
4. Backend checks Redis cache → Miss
5. Backend generates logo.dev URL
6. Backend caches in Redis (7 days)
7. Backend returns URL to frontend
8. Frontend caches in memory
9. Logo displayed to user

Next request for "Google":
1. Frontend memory cache → Hit
2. Logo displayed immediately
```

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
```

### Logo.dev Token

**Important**: Update the placeholder token in both:
- `/backend/app/services/logo_cache_service.py`
- `/front-end/src/services/logoService.js`

Replace `pk_X-1ZO13GSgeOoUrIuJ6GMQ` with your actual Logo.dev API token.

## API Usage Examples

### Get Single Logo
```bash
curl http://localhost:5000/api/logos/company/Google
```

Response:
```json
{
  "company_name": "Google",
  "logo_url": "https://img.logo.dev/google.com?token=...",
  "cached": true
}
```

### Batch Logo Request
```bash
curl -X POST http://localhost:5000/api/logos/batch \
  -H "Content-Type: application/json" \
  -d '{"companies": ["Google", "Microsoft", "Apple"]}'
```

### Cache Statistics
```bash
curl http://localhost:5000/api/logos/cache/stats
```

## Performance Benefits

1. **Reduced API Calls**: Logo URLs cached for 7 days
2. **Faster Loading**: Memory cache provides instant logo access
3. **Batch Processing**: Multiple logos fetched in single request
4. **Intelligent Fallbacks**: Multiple domain formats attempted
5. **Validation**: URLs tested before caching

## Monitoring

### Health Check
```bash
curl http://localhost:5000/api/logos/health
```

### Cache Stats
- View cached logo count
- Monitor Redis memory usage
- Track cache hit rates

## Deployment

1. **Start Services**
   ```bash
   docker-compose up --build
   ```

2. **Verify Redis**
   ```bash
   docker-compose logs redis
   ```

3. **Test Logo API**
   ```bash
   curl http://localhost:5000/api/logos/health
   ```

## Cache Management

### Clear Specific Company
```bash
curl -X POST http://localhost:5000/api/logos/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Google"}'
```

### Clear All Cache
```bash
curl -X POST http://localhost:5000/api/logos/cache/clear \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Troubleshooting

### Redis Connection Issues
1. Check Docker container status: `docker-compose ps`
2. View Redis logs: `docker-compose logs redis`
3. Test Redis connection: `docker-compose exec redis redis-cli ping`

### Logo Loading Issues
1. Check backend logs for Redis errors
2. Verify Logo.dev API token is valid
3. Test health endpoint: `/api/logos/health`

### Frontend Issues
1. Check browser console for JavaScript errors
2. Verify API base URL configuration
3. Test logo service in browser dev tools:
   ```javascript
   import { logoService } from './services/logoService';
   logoService.getCompanyLogo('Google').then(console.log);
   ```

## Future Enhancements

1. **CDN Integration**: Cache logos in CDN for global distribution
2. **Image Optimization**: Resize and optimize logos server-side
3. **A/B Testing**: Test different logo providers
4. **Analytics**: Track logo load times and cache hit rates
5. **Admin Dashboard**: Web interface for cache management
