import redis
import requests
import json
import time
import os
import base64
import hashlib
from app.config import Config

class LogoCacheService:
    """Service for caching company logo images using Redis"""
    
    def __init__(self):
        self.redis_client = None
        self.logo_dev_token = os.getenv('LOGO_DEV_API_TOKEN', 'pk_X-1ZO13GSgeOoUrIuJ6GMQ')
        self.logo_dev_search_url = "https://img.logo.dev/search"
        self.cache_ttl = 30 * 24 * 60 * 60  # 30 days for images
        self.search_cache_ttl = 24 * 60 * 60  # 1 day for search results
        self.connect_redis()
    
    def connect_redis(self):
        """Connect to Redis server"""
        try:
            self.redis_client = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                db=Config.REDIS_DB,
                decode_responses=False,  # Binary mode for images
                socket_timeout=10,
                socket_connect_timeout=10
            )
            # Test connection
            self.redis_client.ping()
            print("Redis connection successful")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis_client = None
            print("Redis connection successful")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis_client = None
    
    def get_cache_key(self, company_name):
        """Generate cache key for company logo"""
        clean_name = company_name.lower().replace(' ', '').replace('.', '')
        return f"logo_img:{clean_name}"
    
    def get_metadata_key(self, company_name):
        """Generate cache key for logo metadata"""
        clean_name = company_name.lower().replace(' ', '').replace('.', '')
        return f"logo_meta:{clean_name}"
    
    def get_logo_data(self, company_name):
        """Get logo image data with caching and API search fallback"""
        if not company_name:
            return None, None
        
        cache_key = self.get_cache_key(company_name)
        meta_key = self.get_metadata_key(company_name)
        
        # Step 1: Try to get cached image from Redis
        cached_data = self.get_image_from_cache(cache_key, meta_key)
        if cached_data:
            print(f"Logo image found in cache for {company_name}")
            return cached_data['image_data'], cached_data['content_type']
        
        # Step 2: Try logo.dev search API to find exact company
        search_result = self.search_logo_dev_api(company_name)
        if search_result:
            logo_url = search_result.get('url')
            if logo_url:
                image_data, content_type = self.download_and_cache_image(logo_url, cache_key, meta_key, company_name, source='api_search')
                if image_data:
                    print(f"Logo image downloaded via API search for {company_name}")
                    return image_data, content_type
        
        # Step 3: If API search fails, generate URL using domain pattern
        logo_url = self.generate_logo_url(company_name)
        image_data, content_type = self.download_and_cache_image(logo_url, cache_key, meta_key, company_name, source='generated')
        if image_data:
            print(f"Logo image downloaded via pattern generation for {company_name}")
            return image_data, content_type
        
        print(f"No logo image found for {company_name}")
        return None, None
    
    def download_and_cache_image(self, logo_url, cache_key, meta_key, company_name, source='generated'):
        """Download image from URL and cache in Redis"""
        try:
            # Download the image
            response = requests.get(logo_url, timeout=10, headers={
                'User-Agent': 'JobTracker-LogoCache/1.0'
            })
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', 'image/png')
                
                # Validate it's actually an image
                if not content_type.startswith('image/'):
                    print(f"Invalid content type for {company_name}: {content_type}")
                    return None, None
                
                image_data = response.content
                
                # Cache the image and metadata
                self.cache_image(cache_key, meta_key, image_data, content_type, company_name, source)
                
                return image_data, content_type
            else:
                print(f"Failed to download logo for {company_name}: HTTP {response.status_code}")
                return None, None
                
        except Exception as e:
            print(f"Error downloading logo for {company_name}: {e}")
            return None, None
    
    def cache_image(self, cache_key, meta_key, image_data, content_type, company_name, source='generated'):
        """Cache image data and metadata in Redis"""
        if not self.redis_client:
            return
        
        try:
            # Cache the raw image data
            self.redis_client.setex(cache_key, self.cache_ttl, image_data)
            
            # Cache metadata as JSON
            metadata = {
                'content_type': content_type,
                'company_name': company_name,
                'source': source,
                'cached_at': int(time.time()),
                'size': len(image_data)
            }
            
            self.redis_client.setex(meta_key, self.cache_ttl, json.dumps(metadata))
            print(f"Cached image for {company_name} ({len(image_data)} bytes)")
            
        except Exception as e:
            print(f"Error caching image for {company_name}: {e}")
    
    def get_image_from_cache(self, cache_key, meta_key):
        """Get image data and metadata from Redis cache"""
        if not self.redis_client:
            return None
        
        try:
            # Get image data
            image_data = self.redis_client.get(cache_key)
            if not image_data:
                return None
            
            # Get metadata
            meta_json = self.redis_client.get(meta_key)
            if meta_json:
                metadata = json.loads(meta_json.decode('utf-8'))
                return {
                    'image_data': image_data,
                    'content_type': metadata.get('content_type', 'image/png'),
                    'metadata': metadata
                }
            else:
                # Fallback if metadata is missing
                return {
                    'image_data': image_data,
                    'content_type': 'image/png',
                    'metadata': {}
                }
                
        except Exception as e:
            print(f"Error getting image from cache: {e}")
            return None

    def search_logo_dev_api(self, company_name):
        """Search logo.dev API for company logo"""
        try:
            # Check if we have a cached search result (use text-based redis client)
            search_cache_key = f"search:{company_name.lower().replace(' ', '')}"
            cached_search = self.get_search_from_cache(search_cache_key)
            if cached_search:
                return cached_search
            
            # Make API request to logo.dev search
            params = {
                'q': company_name,
                'token': self.logo_dev_token,
                'limit': 1  # We only need the best match
            }
            
            response = requests.get(
                'https://img.logo.dev/search',
                params=params,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                if results:
                    best_match = results[0]
                    search_result = {
                        'url': f"https://img.logo.dev/{best_match.get('domain', '')}?token={self.logo_dev_token}",
                        'domain': best_match.get('domain', ''),
                        'company_name': best_match.get('name', company_name),
                        'confidence': best_match.get('score', 0),
                        'source': 'api_search'
                    }
                    
                    # Cache search result for shorter time
                    self.cache_search_result(search_cache_key, search_result)
                    return search_result
            
            return None
            
        except Exception as e:
            print(f"Error searching logo.dev API for {company_name}: {e}")
            return None
    
    def get_search_from_cache(self, cache_key):
        """Get search result from cache (text-based)"""
        try:
            # Create a text-based redis client for search results
            text_redis = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                db=Config.REDIS_DB,
                decode_responses=True
            )
            
            cached_data = text_redis.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            print(f"Error getting search from cache: {e}")
            return None
    
    def cache_search_result(self, cache_key, search_result):
        """Cache search result with shorter TTL"""
        try:
            # Create a text-based redis client for search results
            text_redis = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                db=Config.REDIS_DB,
                decode_responses=True
            )
            
            cache_data = {
                **search_result,
                'cached_at': int(time.time()),
                'type': 'search_result'
            }
            
            # Use shorter TTL for search results (1 day)
            text_redis.setex(
                cache_key, 
                self.search_cache_ttl,
                json.dumps(cache_data)
            )
            print(f"Cached search result for {cache_key}")
        except Exception as e:
            print(f"Error caching search result: {e}")

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
    
    def cache_logo(self, cache_key, logo_url, company_name, source='generated'):
        """Cache logo data in Redis"""
        if not self.redis_client:
            return
        
        try:
            cache_data = {
                'url': logo_url,
                'company_name': company_name,
                'source': source,
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
    
    def search_companies(self, query, limit=10):
        """Search for companies using logo.dev autocomplete API"""
        if not query or len(query) < 2:
            return []
        
        # Check cache first
        cache_key = f"autocomplete:{query.lower()}"
        cached_results = self.get_autocomplete_from_cache(cache_key)
        if cached_results:
            return cached_results
        
        try:
            # Make request to logo.dev search API
            url = f"https://img.logo.dev/search"
            params = {
                'q': query,
                'limit': limit,
                'token': self.logo_dev_token
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                results = []
                
                for item in data.get('results', []):
                    company_data = {
                        'name': item.get('name', ''),
                        'domain': item.get('domain', ''),
                        'logo_url': f"https://img.logo.dev/{item.get('domain')}?token={self.logo_dev_token}",
                        'description': item.get('description', ''),
                        'industry': item.get('industry', ''),
                        'confidence': item.get('confidence', 0)
                    }
                    results.append(company_data)
                
                # Cache the results
                self.cache_autocomplete(cache_key, results)
                return results
            else:
                print(f"Logo.dev search API error: {response.status_code}")
                return self.fallback_search(query, limit)
                
        except Exception as e:
            print(f"Error searching companies: {e}")
            return self.fallback_search(query, limit)
    
    def fallback_search(self, query, limit=10):
        """Fallback search when logo.dev API is unavailable"""
        # Generate suggestions based on common patterns
        results = []
        query_lower = query.lower()
        
        # Common company name patterns
        patterns = [
            f"{query_lower}",
            f"{query_lower}.com",
            f"{query_lower}inc.com",
            f"{query_lower}corp.com",
            f"{query_lower}tech.com",
            f"{query_lower}labs.com",
        ]
        
        for i, pattern in enumerate(patterns[:limit]):
            if '.' not in pattern:
                pattern += '.com'
                
            results.append({
                'name': query.title(),
                'domain': pattern,
                'logo_url': f"https://img.logo.dev/{pattern}?token={self.logo_dev_token}",
                'description': f"Company matching '{query}'",
                'industry': 'Unknown',
                'confidence': max(0.9 - (i * 0.1), 0.1)
            })
        
        return results
    
    def get_autocomplete_from_cache(self, cache_key):
        """Get autocomplete results from cache"""
        if not self.redis_client:
            return None
        
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Error getting autocomplete from cache: {e}")
        
        return None
    
    def cache_autocomplete(self, cache_key, results):
        """Cache autocomplete results"""
        if not self.redis_client:
            return
        
        try:
            cache_data = {
                'results': results,
                'cached_at': int(time.time())
            }
            
            self.redis_client.setex(
                cache_key, 
                self.autocomplete_cache_ttl, 
                json.dumps(cache_data)
            )
            print(f"Cached autocomplete results for {cache_key}")
        except Exception as e:
            print(f"Error caching autocomplete: {e}")
    
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
