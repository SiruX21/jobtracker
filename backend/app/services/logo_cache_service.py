import redis
import requests
import json
import time
import os
import base64
import hashlib
from urllib.parse import quote
from app.config import Config

class LogoCacheService:
    """Service for caching company logo images using Redis"""
    
    def __init__(self):
        self.redis_client = None
        self.brandfetch_api_key = os.getenv('BRANDFETCH_API_KEY', '')  # Brandfetch API key
        self.brandfetch_search_url = "https://api.brandfetch.io/v2/search"
        self.brandfetch_brand_url = "https://api.brandfetch.io/v2/brands"
        self.cache_ttl = 30 * 24 * 60 * 60  # 30 days for images
        self.search_cache_ttl = 24 * 60 * 60  # 1 day for search results
        self.autocomplete_cache_ttl = 6 * 60 * 60  # 6 hours for autocomplete
        self.service_config = 'brandfetch'  # Only use Brandfetch
        self.connect_redis()
        self.load_service_config()  # Load saved configuration
        
        # Debug environment variables
        print(f"🔧 LogoCacheService init:")
        print(f"   - Brandfetch API key: {'✅ SET' if self.brandfetch_api_key else '❌ NOT SET'}")
        print(f"   - Service config: {self.service_config}")
        print(f"   - Should use Brandfetch: {self.should_use_brandfetch()}")
    
    def connect_redis(self):
        """Connect to Redis server"""
        try:
            redis_config = {
                'host': Config.REDIS_HOST,
                'port': Config.REDIS_PORT,
                'db': Config.REDIS_DB,
                'decode_responses': False,  # Binary mode for images
                'socket_timeout': 10,
                'socket_connect_timeout': 10
            }
            
            # Add password if configured
            if Config.REDIS_PASSWORD:
                redis_config['password'] = Config.REDIS_PASSWORD
            
            # Add SSL configuration if enabled
            if Config.REDIS_SSL:
                redis_config['ssl'] = True
                if Config.REDIS_SSL_CERT_REQS:
                    import ssl
                    if Config.REDIS_SSL_CERT_REQS.lower() == 'required':
                        redis_config['ssl_cert_reqs'] = ssl.CERT_REQUIRED
                    elif Config.REDIS_SSL_CERT_REQS.lower() == 'optional':
                        redis_config['ssl_cert_reqs'] = ssl.CERT_OPTIONAL
                    else:
                        redis_config['ssl_cert_reqs'] = ssl.CERT_NONE
            
            self.redis_client = redis.Redis(**redis_config)
            # Test connection
            self.redis_client.ping()
            print("Redis connection successful")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis_client = None
    
    def get_cache_key(self, company_name):
        """Generate cache key for company logo"""
        # Use a more robust cache key that includes a hash to prevent collisions
        clean_name = company_name.lower().strip()
        # Create a hash of the original name to ensure uniqueness
        name_hash = hashlib.md5(clean_name.encode('utf-8')).hexdigest()[:8]
        # Combine clean name with hash for readability and uniqueness
        safe_name = clean_name.replace(' ', '_').replace('.', '_').replace('/', '_')[:30]
        return f"logo_img:{safe_name}_{name_hash}"
    
    def get_metadata_key(self, company_name):
        """Generate cache key for logo metadata"""
        # Use a more robust cache key that includes a hash to prevent collisions
        clean_name = company_name.lower().strip()
        # Create a hash of the original name to ensure uniqueness
        name_hash = hashlib.md5(clean_name.encode('utf-8')).hexdigest()[:8]
        # Combine clean name with hash for readability and uniqueness
        safe_name = clean_name.replace(' ', '_').replace('.', '_').replace('/', '_')[:30]
        return f"logo_meta:{safe_name}_{name_hash}"
    
    def get_logo_data(self, company_name):
        """Get logo image data with caching using only Brandfetch API"""
        if not company_name:
            print(f"❌ get_logo_data: No company name provided")
            return None, None
        
        print(f"🔍 get_logo_data: Searching for logo for '{company_name}'")
        
        cache_key = self.get_cache_key(company_name)
        meta_key = self.get_metadata_key(company_name)
        
        # Step 1: Try to get cached image from Redis
        cached_data = self.get_image_from_cache(cache_key, meta_key)
        if cached_data:
            print(f"✅ get_logo_data: Logo found in CACHE for '{company_name}' (source: {cached_data.get('metadata', {}).get('source', 'unknown')})")
            return cached_data['image_data'], cached_data['content_type']
        
        print(f"🔄 get_logo_data: No cache hit for '{company_name}', trying Brandfetch API...")
        
        # Step 2: Try Brandfetch API for company search
        try:
            search_result = self.search_brandfetch_api(company_name)
            print(f"🔍 get_logo_data: search_brandfetch_api returned: {search_result}")
            
            if search_result:
                logo_url = search_result.get('url')
                found_company_name = search_result.get('company_name', 'Unknown')
                if logo_url:
                    print(f"🎯 get_logo_data: Found logo via BRANDFETCH API for '{company_name}' -> '{found_company_name}': {logo_url}")
                    image_data, content_type = self.download_and_cache_image(logo_url, cache_key, meta_key, company_name, source='brandfetch_api')
                    if image_data:
                        print(f"✅ get_logo_data: Successfully downloaded and cached logo from BRANDFETCH for '{company_name}' -> '{found_company_name}'")
                        return image_data, content_type
                    else:
                        print(f"❌ get_logo_data: Failed to download image for '{company_name}' from URL: {logo_url}")
                else:
                    print(f"❌ get_logo_data: No logo URL in search result for '{company_name}'")
            else:
                print(f"❌ get_logo_data: search_brandfetch_api returned None for '{company_name}'")
        except Exception as e:
            print(f"❌ get_logo_data: Exception during Brandfetch API search for '{company_name}': {e}")

        print(f"❌ get_logo_data: No logo found for '{company_name}' from Brandfetch API")
        return None, None
    
    def download_and_cache_image(self, logo_url, cache_key, meta_key, company_name, source='generated'):
        """Download image from URL and cache in Redis"""
        try:
            # Download the image
            response = requests.get(logo_url, timeout=10, headers={
                'User-Agent': 'jobtrack.dev-LogoCache/1.0'
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

    def search_brandfetch_api(self, company_name):
        """Search Brandfetch API for company logo and brand data"""
        print(f"🚀 search_brandfetch_api: Starting search for '{company_name}'")
        
        try:
            # Check if we have a cached search result
            # Use a more robust cache key that prevents collisions
            clean_name = company_name.lower().strip()
            name_hash = hashlib.md5(clean_name.encode('utf-8')).hexdigest()[:8]
            search_cache_key = f"brandfetch_direct_search:{clean_name.replace(' ', '_')}_{name_hash}"
            print(f"🔑 search_brandfetch_api: Using cache key: {search_cache_key}")
            
            cached_search = self.get_search_from_cache(search_cache_key)
            if cached_search:
                print(f"🔄 search_brandfetch_api: Using cached Brandfetch search for '{company_name}' -> {cached_search.get('company_name', 'Unknown')}")
                return cached_search
            
            # Only proceed if we have API key
            if not self.brandfetch_api_key:
                print(f"❌ search_brandfetch_api: No Brandfetch API key available for '{company_name}'")
                return None
            
            print(f"🌐 search_brandfetch_api: Making API request for '{company_name}'")
            
            headers = {
                'Authorization': f'Bearer {self.brandfetch_api_key}',
                'Content-Type': 'application/json'
            }
            
            api_url = self.brandfetch_search_url + f"/{company_name}"
            print(f"📡 search_brandfetch_api: URL: {api_url}")
            
            response = requests.get(
                api_url,
                headers=headers,
                timeout=5
            )
            
            print(f"📊 search_brandfetch_api: Response status: {response.status_code}")
            
            if response.status_code == 200:
                search_data = response.json()
                print(f"📋 search_brandfetch_api: Found {len(search_data)} results for '{company_name}'")
                
                # Get the first result from the search, but prefer exact matches
                if search_data and len(search_data) > 0:
                    # Try to find exact match first, preferring higher scores
                    exact_matches = []
                    best_match = None
                    
                    for brand in search_data:
                        brand_name = brand.get('name', '').lower().strip()
                        score = brand.get('_score', 0)
                        
                        if brand_name == company_name.lower().strip():
                            exact_matches.append((brand, score))
                            print(f"🎯 search_brandfetch_api: Found exact match for '{company_name}': {brand.get('name', 'Unknown')} (score: {score})")
                        elif not best_match:
                            best_match = brand
                    
                    # Sort exact matches by score (highest first) and take the best one
                    if exact_matches:
                        # Special handling for well-known companies
                        if company_name.lower().strip() == 'meta':
                            # For Meta, prefer the meta.com domain over others
                            meta_com_match = None
                            for brand, score in exact_matches:
                                if brand.get('domain') == 'meta.com':
                                    meta_com_match = (brand, score)
                                    break
                            
                            if meta_com_match:
                                brand = meta_com_match[0]
                                print(f"🔍 search_brandfetch_api: Using meta.com domain match for '{company_name}': {brand.get('name', 'Unknown')} (score: {meta_com_match[1]})")
                            else:
                                exact_matches.sort(key=lambda x: x[1], reverse=True)
                                brand = exact_matches[0][0]
                                print(f"🔍 search_brandfetch_api: Using highest-scored exact match for '{company_name}': {brand.get('name', 'Unknown')} (score: {exact_matches[0][1]})")
                        else:
                            exact_matches.sort(key=lambda x: x[1], reverse=True)
                            brand = exact_matches[0][0]  # Take the brand with highest score
                            print(f"🔍 search_brandfetch_api: Using highest-scored exact match for '{company_name}': {brand.get('name', 'Unknown')} (score: {exact_matches[0][1]})")
                    else:
                        brand = best_match
                        if brand:
                            print(f"🔍 search_brandfetch_api: Using first result for '{company_name}': {brand.get('name', 'Unknown')} (no exact match)")
                    
                    if not brand:
                        print(f"❌ search_brandfetch_api: No suitable brand found for '{company_name}'")
                        return None
                    
                    # Extract logo information using improved logic
                    logo_url = None
                    
                    # Try to get the best logo from brand data
                    if 'logos' in brand and brand['logos']:
                        print(f"🖼️ search_brandfetch_api: Found {len(brand['logos'])} logos for {company_name}")
                        # Get the first logo (usually the primary one)
                        for logo_idx, logo in enumerate(brand['logos']):
                            if 'formats' in logo and logo['formats']:
                                # Prefer PNG, then SVG, then any format
                                for format_item in logo['formats']:
                                    if format_item.get('format') == 'png' and format_item.get('src'):
                                        logo_url = format_item.get('src')
                                        print(f"   Selected PNG logo: {logo_url}")
                                        break
                                if not logo_url:
                                    for format_item in logo['formats']:
                                        if format_item.get('format') == 'svg' and format_item.get('src'):
                                            logo_url = format_item.get('src')
                                            print(f"   Selected SVG logo: {logo_url}")
                                            break
                                if not logo_url and logo['formats']:
                                    first_format = logo['formats'][0]
                                    if first_format.get('src'):
                                        logo_url = first_format.get('src')
                                        print(f"   Selected first available logo: {logo_url}")
                                break  # Use first logo that has formats
                    
                    # Fallback to icon if no logo found
                    if not logo_url and 'icon' in brand and brand['icon']:
                        logo_url = brand['icon']
                        print(f"   Using icon fallback: {logo_url}")
                    
                    if logo_url:
                        search_result = {
                            'url': logo_url,
                            'domain': brand.get('domain', ''),
                            'company_name': brand.get('name', company_name),
                            'confidence': 0.9,  # High confidence for Brandfetch API
                            'source': 'brandfetch_direct',
                            'description': brand.get('description', ''),
                            'industry': brand.get('industry', '')
                        }
                        
                        # Cache search result with direct search key
                        self.cache_search_result(search_cache_key, search_result)
                        print(f"✅ search_brandfetch_api: Found Brandfetch logo for '{company_name}' -> '{brand.get('name', company_name)}': {logo_url}")
                        return search_result
                    else:
                        print(f"❌ search_brandfetch_api: No logo found in Brandfetch data for '{company_name}'")
                else:
                    print(f"❌ search_brandfetch_api: No Brandfetch search results for '{company_name}'")
            else:
                print(f"❌ search_brandfetch_api: Brandfetch API failed with status {response.status_code}")
                if response.text:
                    print(f"   Response text: {response.text[:200]}...")  # Truncate long responses
            
            print(f"❌ search_brandfetch_api: Returning None for '{company_name}'")
            return None
            
        except Exception as e:
            print(f"❌ search_brandfetch_api: Exception occurred for '{company_name}': {e}")
            import traceback
            print(f"   Traceback: {traceback.format_exc()}")
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
        """Get logo data and validate it works (Brandfetch only)"""
        # Since we only use Brandfetch now, just return the regular logo data
        image_data, content_type = self.get_logo_data(company_name)
        return (image_data, content_type) if image_data else (None, None)
    
    def search_companies(self, query, limit=10):
        """Search for companies using Brandfetch API only"""
        if not query or len(query) < 2:
            print(f"❌ search_companies: Query too short or empty: '{query}'")
            return []

        print(f"🔍 search_companies: Searching for companies with query: '{query}' (limit: {limit})")
        
        # Check cache first
        # Use a more robust cache key for autocomplete to prevent collisions
        query_hash = hashlib.md5(query.lower().encode('utf-8')).hexdigest()[:8]
        cache_key = f"autocomplete:{query.lower().replace(' ', '_')}_{query_hash}"
        cached_results = self.get_autocomplete_from_cache(cache_key)
        if cached_results:
            print(f"✅ search_companies: Found {len(cached_results)} cached results for '{query}'")
            return cached_results

        try:
            # Use Brandfetch API
            if self.should_use_brandfetch():
                print(f"🎯 search_companies: Trying BRANDFETCH API for '{query}'")
                try:
                    results = self.search_brandfetch_autocomplete(query, limit)
                    if results:
                        print(f"✅ search_companies: BRANDFETCH returned {len(results)} results for '{query}'")
                        # Cache the results
                        self.cache_autocomplete(cache_key, results)
                        return results
                    else:
                        print(f"⚠️ search_companies: BRANDFETCH returned no results for '{query}'")
                except Exception as e:
                    print(f"❌ search_companies: BRANDFETCH API failed for '{query}': {e}")
            else:
                print(f"⚠️ search_companies: BRANDFETCH not available (config: {self.service_config}, has_key: {bool(self.brandfetch_api_key)})")
            
            # If Brandfetch fails, return empty results
            print(f"❌ search_companies: No results found for '{query}'")
            return []
                
        except Exception as e:
            print(f"❌ search_companies: Unexpected error for '{query}': {e}")
            return []

    def search_brandfetch_autocomplete(self, query, limit=10):
        """Search Brandfetch API for company autocomplete suggestions"""
        if not self.brandfetch_api_key:
            print(f"❌ search_brandfetch_autocomplete: No Brandfetch API key available for '{query}'")
            return []
        
        print(f"🎯 search_brandfetch_autocomplete: Searching Brandfetch for '{query}' (limit: {limit})")
        
        try:
            headers = {
                'Authorization': f'Bearer {self.brandfetch_api_key}',
                'Content-Type': 'application/json'
            }
            
            # Use Brandfetch search endpoint
            url = f"{self.brandfetch_search_url}/{query}"
            print(f"🌐 search_brandfetch_autocomplete: Making request to: {url}")
            
            response = requests.get(
                url,
                headers=headers,
                timeout=5
            )
            
            print(f"📡 search_brandfetch_autocomplete: Response status: {response.status_code}")
            
            if response.status_code == 200:
                search_data = response.json()
                print(f"📊 search_brandfetch_autocomplete: Raw response data: {len(search_data)} brands found")
                results = []
                
                # Process the results
                for brand in search_data[:limit]:  # Limit results
                    brand_name = brand.get('name', query.title())
                    
                    # Skip invalid or problematic company names
                    if not brand_name or brand_name.lower() in ['null', 'undefined', 'none', '']:
                        print(f"⚠️ search_brandfetch_autocomplete: Skipping invalid brand name: {brand_name}")
                        continue
                    
                    # Skip brands without meaningful domain or logo data
                    if not brand.get('domain') and not brand.get('icon') and not brand.get('logos'):
                        print(f"⚠️ search_brandfetch_autocomplete: Skipping brand with no useful data: {brand_name}")
                        continue
                    
                    print(f"🏢 search_brandfetch_autocomplete: Processing brand: {brand_name}")
                    
                    # Get the best logo URL using the same logic as search_brandfetch_api
                    logo_url = None
                    if 'logos' in brand and brand['logos']:
                        print(f"🖼️ search_brandfetch_autocomplete: Found {len(brand['logos'])} logos for {brand_name}")
                        for logo_idx, logo in enumerate(brand['logos']):
                            if 'formats' in logo and logo['formats']:
                                # Prefer PNG, then SVG, then any format
                                for format_item in logo['formats']:
                                    if format_item.get('format') == 'png' and format_item.get('src'):
                                        logo_url = format_item.get('src')
                                        print(f"   Selected PNG logo for {brand_name}: {logo_url}")
                                        break
                                if not logo_url:
                                    for format_item in logo['formats']:
                                        if format_item.get('format') == 'svg' and format_item.get('src'):
                                            logo_url = format_item.get('src')
                                            print(f"   Selected SVG logo for {brand_name}: {logo_url}")
                                            break
                                if not logo_url and logo['formats']:
                                    first_format = logo['formats'][0]
                                    if first_format.get('src'):
                                        logo_url = first_format.get('src')
                                        print(f"   Selected first available logo for {brand_name}: {logo_url}")
                                break  # Use first logo that has formats
                    
                    # Fallback to icon if no logo found
                    if not logo_url and 'icon' in brand and brand['icon']:
                        logo_url = brand['icon']
                        print(f"   Using icon fallback for {brand_name}: {logo_url}")
                    
                    # Cache this specific brand's logo data immediately to prevent cross-contamination
                    if logo_url:
                        # Store a reference to the original Brandfetch URL in search cache
                        # Use a different cache key pattern for autocomplete to prevent conflicts
                        brand_search_cache_key = f"brandfetch_autocomplete:{brand_name.lower().strip().replace(' ', '_')}_{hashlib.md5(brand_name.lower().encode('utf-8')).hexdigest()[:8]}"
                        brand_search_result = {
                            'url': logo_url,
                            'domain': brand.get('domain', ''),
                            'company_name': brand_name,
                            'confidence': 0.9,
                            'source': 'brandfetch_autocomplete',
                            'description': brand.get('description', ''),
                            'industry': brand.get('industry', '')
                        }
                        self.cache_search_result(brand_search_cache_key, brand_search_result)
                        print(f"   Cached autocomplete search result for {brand_name} with key: {brand_search_cache_key}")
                    
                    print(f"🖼️ search_brandfetch_autocomplete: Final logo URL for {brand_name}: {logo_url}")
                    
                    company_data = {
                        'name': brand_name,
                        'domain': brand.get('domain', ''),
                        'logo_url': f"/api/logos/company/{quote(brand_name)}" if brand_name else None,
                        'description': brand.get('description', ''),
                        'industry': brand.get('industry', ''),
                        'confidence': 0.85,  # High confidence for Brandfetch
                        'source': 'brandfetch',
                        'icon': logo_url  # Store direct icon URL for debugging
                    }
                    results.append(company_data)
                
                print(f"✅ search_brandfetch_autocomplete: Successfully processed {len(results)} brands for '{query}'")
                return results
            else:
                print(f"❌ search_brandfetch_autocomplete: API failed with status {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ search_brandfetch_autocomplete: Exception occurred for '{query}': {e}")
            return []

    def should_use_brandfetch(self):
        """Check if Brandfetch should be used based on configuration"""
        return self.service_config == 'brandfetch' and self.brandfetch_api_key

    def get_autocomplete_from_cache(self, cache_key):
        """Get autocomplete results from cache"""
        if not self.redis_client:
            return None
        
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                cache_obj = json.loads(cached_data)
                # Return the results array, not the wrapper object
                return cache_obj.get('results', [])
        except Exception as e:
            print(f"Error getting autocomplete from cache: {e}")
            return None
        
        return None
    
    def cache_autocomplete(self, cache_key, results, ttl=None):
        """Cache autocomplete results"""
        if not self.redis_client:
            return
        
        try:
            cache_data = {
                'results': results,
                'cached_at': int(time.time())
            }
            
            # Use provided TTL or default
            cache_ttl = ttl if ttl is not None else getattr(self, 'autocomplete_cache_ttl', 3600)
            
            self.redis_client.setex(
                cache_key, 
                cache_ttl, 
                json.dumps(cache_data)
            )
            print(f"Cached autocomplete results for {cache_key}")
        except Exception as e:
            print(f"Error caching autocomplete: {e}")
    
    def clear_cache(self, company_name=None):
        """Clear logo cache for specific company or all logos"""
        if not self.redis_client:
            return {"error": "Redis not connected", "cleared_count": 0}
        
        try:
            if company_name:
                # Clear both image cache and search cache for specific company
                cache_key = self.get_cache_key(company_name)
                meta_key = self.get_metadata_key(company_name)
                
                # Generate all possible search cache keys
                clean_name = company_name.lower().strip()
                name_hash = hashlib.md5(clean_name.encode('utf-8')).hexdigest()[:8]
                direct_search_key = f"brandfetch_direct_search:{clean_name.replace(' ', '_')}_{name_hash}"
                autocomplete_search_key = f"brandfetch_search:{clean_name.replace(' ', '_')}_{name_hash}"
                autocomplete_brand_key = f"brandfetch_autocomplete:{clean_name.replace(' ', '_')}_{name_hash}"
                
                cleared_keys = []
                if self.redis_client.delete(cache_key):
                    cleared_keys.append(cache_key)
                if self.redis_client.delete(meta_key):
                    cleared_keys.append(meta_key)
                
                # Also clear with text redis client for search cache
                try:
                    text_redis = redis.Redis(
                        host=Config.REDIS_HOST,
                        port=Config.REDIS_PORT,
                        db=Config.REDIS_DB,
                        decode_responses=True
                    )
                    if text_redis.delete(direct_search_key):
                        cleared_keys.append(direct_search_key)
                    if text_redis.delete(autocomplete_search_key):
                        cleared_keys.append(autocomplete_search_key)
                    if text_redis.delete(autocomplete_brand_key):
                        cleared_keys.append(autocomplete_brand_key)
                except Exception as e:
                    print(f"Error clearing search cache: {e}")
                
                result = {
                    "company_name": company_name,
                    "cleared_count": len(cleared_keys),
                    "cleared_keys": cleared_keys,
                    "success": True
                }
                print(f"Cleared cache for {company_name}: {cleared_keys}")
                return result
            else:
                # Clear all logo cache entries
                logo_keys = self.redis_client.keys("logo_img:*")
                meta_keys = self.redis_client.keys("logo_meta:*")
                search_keys = self.redis_client.keys("brandfetch_search:*")
                direct_search_keys = self.redis_client.keys("brandfetch_direct_search:*")
                autocomplete_brand_keys = self.redis_client.keys("brandfetch_autocomplete:*")
                autocomplete_keys = self.redis_client.keys("autocomplete:*")
                
                # Count before clearing
                counts = {
                    "logo_images": len(logo_keys),
                    "metadata": len(meta_keys),
                    "search_results": len(search_keys),
                    "direct_search_results": len(direct_search_keys),
                    "autocomplete_brand_results": len(autocomplete_brand_keys),
                    "autocomplete": len(autocomplete_keys)
                }
                
                all_keys = logo_keys + meta_keys + search_keys + direct_search_keys + autocomplete_brand_keys + autocomplete_keys
                cleared_count = 0
                if all_keys:
                    cleared_count = self.redis_client.delete(*all_keys)
                
                result = {
                    "cleared_count": cleared_count,
                    "breakdown": counts,
                    "total_keys": len(all_keys),
                    "success": True
                }
                
                print(f"Cleared {cleared_count} logo cache entries: {counts}")
                return result
        except Exception as e:
            error_result = {"error": str(e), "cleared_count": 0, "success": False}
            print(f"Error clearing cache: {e}")
            return error_result
    
    def guess_company_domain(self, company_name):
        """Guess the most likely domain for a company name"""
        # Clean the company name
        clean_name = company_name.lower().strip()
        
        # Handle common company mappings
        domain_mappings = {
            'google': 'google.com',
            'alphabet': 'google.com',
            'apple': 'apple.com',
            'microsoft': 'microsoft.com',
            'meta': 'meta.com',
            'facebook': 'meta.com',
            'amazon': 'amazon.com',
            'tesla': 'tesla.com',
            'netflix': 'netflix.com',
            'uber': 'uber.com',
            'airbnb': 'airbnb.com',
            'twitter': 'twitter.com',
            'x': 'x.com',
            'linkedin': 'linkedin.com',
            'spotify': 'spotify.com',
            'discord': 'discord.com',
            'slack': 'slack.com',
            'figma': 'figma.com',
            'canva': 'canva.com',
            'adobe': 'adobe.com',
            'salesforce': 'salesforce.com',
            'oracle': 'oracle.com',
            'ibm': 'ibm.com',
            'intel': 'intel.com',
            'nvidia': 'nvidia.com',
            'amd': 'amd.com',
            'paypal': 'paypal.com',
            'stripe': 'stripe.com',
            'coinbase': 'coinbase.com',
            'shopify': 'shopify.com',
            'squareup': 'squareup.com',
            'square': 'squareup.com',
            'zoom': 'zoom.us',
            'github': 'github.com',
            'gitlab': 'gitlab.com',
            'redis': 'redis.io',
            'mongodb': 'mongodb.com',
            'elastic': 'elastic.co',
            'databricks': 'databricks.com',
            'snowflake': 'snowflake.com',
            'palantir': 'palantir.com',
            'mckinsey': 'mckinsey.com',
            'bcg': 'bcg.com',
            'bain': 'bain.com',
            'deloitte': 'deloitte.com',
            'accenture': 'accenture.com',
            'pwc': 'pwc.com',
            'ey': 'ey.com',
            'kpmg': 'kpmg.com',
            'ford': 'ford.com',
            'gm': 'gm.com',
            'general motors': 'gm.com',
            'bmw': 'bmw.com',
            'toyota': 'toyota.com',
            'honda': 'honda.com',
            'volkswagen': 'vw.com',
            'booking': 'booking.com',
            'expedia': 'expedia.com',
            'airbnb': 'airbnb.com',
            'lyft': 'lyft.com',
            'doordash': 'doordash.com',
            'grubhub': 'grubhub.com',
            'youtube': 'youtube.com',
            'tiktok': 'tiktok.com',
            'instagram': 'instagram.com',
            'snapchat': 'snapchat.com',
            'pinterest': 'pinterest.com',
            'reddit': 'reddit.com',
            'twitch': 'twitch.tv',
            'epicgames': 'epicgames.com',
            'epic games': 'epicgames.com',
            'activision': 'activision.com',
            'activisionblizzard': 'activisionblizzard.com',
            'ea': 'ea.com',
            'electronic arts': 'ea.com',
            'riotgames': 'riotgames.com',
            'riot games': 'riotgames.com',
            'valve': 'valvesoftware.com',
            'steam': 'steampowered.com',
            'airtable': 'airtable.com',
            'notion': 'notion.so',
            'asana': 'asana.com',
            'trello': 'trello.com',
            'monday': 'monday.com',
            'clickup': 'clickup.com'
        }
        
        # Check direct mapping first
        if clean_name in domain_mappings:
            return domain_mappings[clean_name]
        
        # Try common patterns
        # Remove common words
        clean_name = clean_name.replace(' inc', '').replace(' corp', '').replace(' corporation', '')
        clean_name = clean_name.replace(' ltd', '').replace(' limited', '').replace(' llc', '')
        clean_name = clean_name.replace(' company', '').replace(' co', '').replace(' and co', '')
        clean_name = clean_name.replace(' technologies', '').replace(' technology', '').replace(' tech', '')
        clean_name = clean_name.replace(' systems', '').replace(' solutions', '').replace(' services', '')
        clean_name = clean_name.replace(' software', '').replace(' labs', '').replace(' group', '')
        clean_name = clean_name.replace(' ', '').replace('.', '').replace('-', '')
        
        # Check mapping again after cleaning
        if clean_name in domain_mappings:
            return domain_mappings[clean_name]
        
        # Try common domain extensions
        if clean_name:
            return f"{clean_name}.com"
        
        return None

    def get_cache_stats(self):
        """Get cache statistics"""
        if not self.redis_client:
            return {"error": "Redis not connected"}
        
        try:
            logo_img_keys = self.redis_client.keys("logo_img:*")
            logo_meta_keys = self.redis_client.keys("logo_meta:*")
            search_keys = self.redis_client.keys("brandfetch_search:*")
            direct_search_keys = self.redis_client.keys("brandfetch_direct_search:*")
            autocomplete_brand_keys = self.redis_client.keys("brandfetch_autocomplete:*")
            autocomplete_keys = self.redis_client.keys("autocomplete:*")
            
            # Calculate cache size by getting total memory usage for logo images
            cache_size = 0
            try:
                for key in logo_img_keys[:100]:  # Sample first 100 to avoid timeout
                    size = self.redis_client.memory_usage(key)
                    if size:
                        cache_size += size
                # Estimate total size based on sample
                if len(logo_img_keys) > 100:
                    cache_size = int(cache_size * (len(logo_img_keys) / 100))
            except Exception as e:
                print(f"Error calculating cache size: {e}")
                cache_size = 0
            
            # Get Redis memory info
            try:
                redis_info = self.redis_client.info("memory")
                used_memory = redis_info.get('used_memory', 0)
            except Exception as e:
                print(f"Error getting Redis memory info: {e}")
                used_memory = 0
            
            # Calculate hit/miss rates (simplified - based on cache vs search entries)
            total_searches = len(search_keys) + len(direct_search_keys) + len(autocomplete_brand_keys) + len(autocomplete_keys)
            cached_results = len(logo_img_keys)
            
            hit_rate = 0.0
            miss_rate = 0.0
            if total_searches > 0:
                hit_rate = min(1.0, cached_results / total_searches)
                miss_rate = 1.0 - hit_rate
            
            return {
                "cached_count": len(logo_img_keys),
                "cache_size": cache_size,
                "hit_rate": hit_rate,
                "miss_rate": miss_rate,
                "total_cached_logos": len(logo_img_keys),
                "metadata_entries": len(logo_meta_keys),
                "search_cache_entries": len(search_keys),
                "direct_search_cache_entries": len(direct_search_keys),
                "autocomplete_brand_cache_entries": len(autocomplete_brand_keys),
                "autocomplete_cache_entries": len(autocomplete_keys),
                "redis_used_memory": used_memory,
                "sample_logo_keys": [k.decode('utf-8') if isinstance(k, bytes) else k for k in logo_img_keys[:5]]
            }
        except Exception as e:
            print(f"Error in get_cache_stats: {e}")
            return {"error": str(e)}

    def get_service_config(self):
        """Get current logo service configuration"""
        try:
            # Check Brandfetch API status
            brandfetch_status = "unknown"
            try:
                test_response = requests.get(
                    f"{self.brandfetch_search_url}/test",
                    headers={'Authorization': f'Bearer {self.brandfetch_api_key}'},
                    timeout=3
                )
                if test_response.status_code in [200, 404]:  # 404 is ok for test endpoint
                    brandfetch_status = "available"
                elif test_response.status_code == 401:
                    brandfetch_status = "invalid_token"
                else:
                    brandfetch_status = "error"
            except:
                brandfetch_status = "unavailable"
            
            return {
                "current_service": self.service_config,
                "available_services": ["brandfetch"],
                "service_status": {
                    "brandfetch": {
                        "status": brandfetch_status,
                        "has_key": bool(self.brandfetch_api_key),
                        "endpoint": self.brandfetch_search_url
                    }
                },
                "cache_ttl": self.cache_ttl,
                "search_cache_ttl": self.search_cache_ttl
            }
        except Exception as e:
            print(f"Error getting service config: {e}")
            return {"error": str(e)}

    def set_service_config(self, service_type):
        """Set logo service configuration"""
        try:
            valid_services = ['brandfetch']
            if service_type not in valid_services:
                return {"error": "Invalid service type. Only 'brandfetch' is supported."}
            
            self.service_config = service_type
            
            # Store in Redis for persistence
            if self.redis_client:
                try:
                    text_redis = redis.Redis(
                        host=Config.REDIS_HOST,
                        port=Config.REDIS_PORT,
                        db=Config.REDIS_DB,
                        decode_responses=True
                    )
                    text_redis.set("logo_service_config", service_type)
                except Exception as e:
                    print(f"Failed to store service config in Redis: {e}")
            
            return {
                "service_type": service_type,
                "message": f"Logo service set to: {service_type}",
                "success": True
            }
        except Exception as e:
            print(f"Error setting service config: {e}")
            return {"error": str(e)}

    def load_service_config(self):
        """Load service configuration from Redis"""
        try:
            if self.redis_client:
                text_redis = redis.Redis(
                    host=Config.REDIS_HOST,
                    port=Config.REDIS_PORT,
                    db=Config.REDIS_DB,
                    decode_responses=True
                )
                stored_config = text_redis.get("logo_service_config")
                if stored_config:
                    self.service_config = stored_config
        except Exception as e:
            print(f"Error loading service config: {e}")

# Global instance
logo_cache = LogoCacheService()
