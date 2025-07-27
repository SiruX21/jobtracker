import redis
import requests
import json
import time
from app.config import Config

class LogoCacheService:
    """Service for caching company logos using Redis"""
    
    def __init__(self):
        self.redis_client = None
        self.logo_dev_token = "pk_X-1ZO13GSgeOoUrIuJ6GMQ"  # Replace with actual token
        self.cache_ttl = 7 * 24 * 60 * 60  # 7 days in seconds
        self.connect_redis()
    
    def connect_redis(self):
        """Connect to Redis server"""
        try:
            self.redis_client = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                db=Config.REDIS_DB,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            print("Redis connection successful")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis_client = None
    
    def get_cache_key(self, company_name):
        """Generate cache key for company logo"""
        clean_name = company_name.lower().replace(' ', '').replace('.', '')
        return f"logo:{clean_name}"
    
    def get_logo_url(self, company_name):
        """Get logo URL with caching"""
        if not company_name:
            return None
        
        cache_key = self.get_cache_key(company_name)
        
        # Try to get from cache first
        cached_logo = self.get_from_cache(cache_key)
        if cached_logo:
            return cached_logo.get('url')
        
        # If not in cache, generate new URL
        logo_url = self.generate_logo_url(company_name)
        
        # Cache the result
        self.cache_logo(cache_key, logo_url, company_name)
        
        return logo_url
    
    def generate_logo_url(self, company_name):
        """Generate logo.dev URL for company"""
        clean_name = company_name.lower().replace(' ', '').replace('-', '')
        # Remove special characters except dots
        clean_name = ''.join(c for c in clean_name if c.isalnum() or c == '.')
        
        # Default to .com if no domain extension
        if '.' not in clean_name:
            clean_name += '.com'
        
        return f"https://img.logo.dev/{clean_name}?token={self.logo_dev_token}"
    
    def get_from_cache(self, cache_key):
        """Get logo data from Redis cache"""
        if not self.redis_client:
            return None
        
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Error getting from cache: {e}")
        
        return None
    
    def cache_logo(self, cache_key, logo_url, company_name):
        """Cache logo data in Redis"""
        if not self.redis_client:
            return
        
        try:
            cache_data = {
                'url': logo_url,
                'company_name': company_name,
                'cached_at': int(time.time())
            }
            
            self.redis_client.setex(
                cache_key, 
                self.cache_ttl, 
                json.dumps(cache_data)
            )
            print(f"Cached logo for {company_name}")
        except Exception as e:
            print(f"Error caching logo: {e}")
    
    def validate_logo_url(self, logo_url):
        """Validate that logo URL returns a valid image"""
        try:
            response = requests.head(logo_url, timeout=5)
            content_type = response.headers.get('content-type', '')
            return (response.status_code == 200 and 
                   content_type.startswith('image/'))
        except Exception:
            return False
    
    def get_logo_with_validation(self, company_name):
        """Get logo URL and validate it works"""
        logo_url = self.get_logo_url(company_name)
        
        if not logo_url:
            return None
        
        # For cached URLs, we assume they're valid
        cache_key = self.get_cache_key(company_name)
        cached_data = self.get_from_cache(cache_key)
        
        if cached_data:
            return logo_url
        
        # For new URLs, validate them
        if self.validate_logo_url(logo_url):
            return logo_url
        else:
            # If validation fails, try alternative domains
            alternatives = self.get_alternative_domains(company_name)
            for alt_domain in alternatives:
                alt_url = f"https://img.logo.dev/{alt_domain}?token={self.logo_dev_token}"
                if self.validate_logo_url(alt_url):
                    # Update cache with working URL
                    self.cache_logo(cache_key, alt_url, company_name)
                    return alt_url
        
        return logo_url  # Return original even if validation failed
    
    def get_alternative_domains(self, company_name):
        """Get alternative domain formats for a company"""
        clean_name = company_name.lower().replace(' ', '').replace('-', '')
        alternatives = []
        
        # Try different TLDs
        if not clean_name.endswith('.com'):
            alternatives.append(f"{clean_name}.com")
        
        # Try with hyphens
        if ' ' in company_name.lower():
            hyphenated = company_name.lower().replace(' ', '-')
            alternatives.append(f"{hyphenated}.com")
        
        # Try without common suffixes
        suffixes = ['inc', 'corp', 'corporation', 'company', 'co', 'ltd']
        for suffix in suffixes:
            if clean_name.replace('.com', '').endswith(suffix):
                without_suffix = clean_name.replace('.com', '').replace(suffix, '')
                alternatives.append(f"{without_suffix}.com")
        
        return alternatives[:3]  # Limit to 3 alternatives
    
    def clear_cache(self, company_name=None):
        """Clear logo cache for specific company or all logos"""
        if not self.redis_client:
            return
        
        try:
            if company_name:
                cache_key = self.get_cache_key(company_name)
                self.redis_client.delete(cache_key)
                print(f"Cleared cache for {company_name}")
            else:
                # Clear all logo cache entries
                keys = self.redis_client.keys("logo:*")
                if keys:
                    self.redis_client.delete(*keys)
                print(f"Cleared {len(keys)} logo cache entries")
        except Exception as e:
            print(f"Error clearing cache: {e}")
    
    def get_cache_stats(self):
        """Get cache statistics"""
        if not self.redis_client:
            return {"error": "Redis not connected"}
        
        try:
            logo_keys = self.redis_client.keys("logo:*")
            return {
                "total_cached_logos": len(logo_keys),
                "redis_info": self.redis_client.info("memory"),
                "sample_keys": logo_keys[:10] if logo_keys else []
            }
        except Exception as e:
            return {"error": str(e)}

# Global instance
logo_cache = LogoCacheService()
