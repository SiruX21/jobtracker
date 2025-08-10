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
        search_result = self.search_brandfetch_api(company_name)
        if search_result:
            logo_url = search_result.get('url')
            if logo_url:
                print(f"🎯 get_logo_data: Found logo via BRANDFETCH API for '{company_name}': {logo_url}")
                image_data, content_type = self.download_and_cache_image(logo_url, cache_key, meta_key, company_name, source='brandfetch_api')
                if image_data:
                    print(f"✅ get_logo_data: Successfully downloaded and cached logo from BRANDFETCH for '{company_name}'")
                    return image_data, content_type

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
        try:
            # Check if we have a cached search result
            search_cache_key = f"brandfetch_search:{company_name.lower().replace(' ', '')}"
            cached_search = self.get_search_from_cache(search_cache_key)
            if cached_search:
                print(f"Using cached Brandfetch search for {company_name}")
                return cached_search
            
            # Only proceed if we have API key
            if not self.brandfetch_api_key:
                print("No Brandfetch API key available")
                return None
            
            # First, search for the company
            search_params = {
                'q': company_name
            }
            
            headers = {
                'Authorization': f'Bearer {self.brandfetch_api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                self.brandfetch_search_url + f"/{company_name}",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                search_data = response.json()
                
                # Get the first result from the search
                if search_data and len(search_data) > 0:
                    brand = search_data[0]
                    
                    # Extract logo information
                    logo_url = None
                    
                    # Try to get the best logo from brand data
                    if 'logos' in brand and brand['logos']:
                        # Get the first logo (usually the primary one)
                        for logo in brand['logos']:
                            if 'formats' in logo:
                                # Prefer PNG, then SVG, then any format
                                for format_item in logo['formats']:
                                    if format_item.get('format') == 'png':
                                        logo_url = format_item.get('src')
                                        break
                                if not logo_url:
                                    for format_item in logo['formats']:
                                        if format_item.get('format') == 'svg':
                                            logo_url = format_item.get('src')
                                            break
                                if not logo_url and logo['formats']:
                                    logo_url = logo['formats'][0].get('src')
                                break
                    
                    # Fallback to icon if no logo found
                    if not logo_url and 'icon' in brand:
                        logo_url = brand['icon']
                    
                    if logo_url:
                        search_result = {
                            'url': logo_url,
                            'domain': brand.get('domain', ''),
                            'company_name': brand.get('name', company_name),
                            'confidence': 0.9,  # High confidence for Brandfetch API
                            'source': 'brandfetch',
                            'description': brand.get('description', ''),
                            'industry': brand.get('industry', '')
                        }
                        
                        # Cache search result
                        self.cache_search_result(search_cache_key, search_result)
                        print(f"Found Brandfetch logo for {company_name}: {logo_url}")
                        return search_result
                    else:
                        print(f"No logo found in Brandfetch data for {company_name}")
                else:
                    print(f"No Brandfetch search results for {company_name}")
            else:
                print(f"Brandfetch API failed with status {response.status_code}: {response.text}")
            
            return None
            
        except Exception as e:
            print(f"Error searching Brandfetch API for {company_name}: {e}")
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
        """Search for companies using Brandfetch API only"""
        if not query or len(query) < 2:
            print(f"❌ search_companies: Query too short or empty: '{query}'")
            return []

        print(f"🔍 search_companies: Searching for companies with query: '{query}' (limit: {limit})")
        
        # Check cache first
        cache_key = f"autocomplete:{query.lower()}"
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
                    print(f"🏢 search_brandfetch_autocomplete: Processing brand: {brand_name}")
                    
                    # Get the best logo URL
                    logo_url = None
                    if 'logos' in brand and brand['logos']:
                        for logo in brand['logos']:
                            if 'formats' in logo and logo['formats']:
                                # Prefer PNG format
                                for format_item in logo['formats']:
                                    if format_item.get('format') == 'png':
                                        logo_url = format_item.get('src')
                                        break
                                if not logo_url:
                                    logo_url = logo['formats'][0].get('src')
                                break
                    
                    # Fallback to icon
                    if not logo_url and 'icon' in brand:
                        logo_url = brand['icon']
                    
                    print(f"🖼️ search_brandfetch_autocomplete: Logo URL for {brand_name}: {logo_url}")
                    
                    company_data = {
                        'name': brand_name,
                        'domain': brand.get('domain', ''),
                        'logo_url': f"/api/logos/company/{brand_name}" if brand_name else None,
                        'description': brand.get('description', ''),
                        'industry': brand.get('industry', ''),
                        'confidence': 0.85,  # High confidence for Brandfetch
                        'source': 'brandfetch',
                        'icon': logo_url  # Store direct icon URL for fallback
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
            {'name': 'Uber', 'domain': 'uber.com', 'industry': 'Transportation'},
            {'name': 'Airbnb', 'domain': 'airbnb.com', 'industry': 'Hospitality'},
            {'name': 'LinkedIn', 'domain': 'linkedin.com', 'industry': 'Professional Network'},
            {'name': 'Spotify', 'domain': 'spotify.com', 'industry': 'Music'},
            {'name': 'Discord', 'domain': 'discord.com', 'industry': 'Communication'},
            {'name': 'Slack', 'domain': 'slack.com', 'industry': 'Communication'},
            {'name': 'Figma', 'domain': 'figma.com', 'industry': 'Design'},
            {'name': 'Canva', 'domain': 'canva.com', 'industry': 'Design'},
            {'name': 'Adobe', 'domain': 'adobe.com', 'industry': 'Creative Software'},
            {'name': 'Salesforce', 'domain': 'salesforce.com', 'industry': 'CRM'},
            {'name': 'Oracle', 'domain': 'oracle.com', 'industry': 'Database'},
            {'name': 'IBM', 'domain': 'ibm.com', 'industry': 'Technology'},
            {'name': 'Intel', 'domain': 'intel.com', 'industry': 'Semiconductors'},
            {'name': 'NVIDIA', 'domain': 'nvidia.com', 'industry': 'Graphics'},
            {'name': 'PayPal', 'domain': 'paypal.com', 'industry': 'Payments'},
            {'name': 'Stripe', 'domain': 'stripe.com', 'industry': 'Payments'},
            {'name': 'Coinbase', 'domain': 'coinbase.com', 'industry': 'Cryptocurrency'},
            {'name': 'Shopify', 'domain': 'shopify.com', 'industry': 'E-commerce'},
            {'name': 'Square', 'domain': 'squareup.com', 'industry': 'Payments'},
            {'name': 'GitHub', 'domain': 'github.com', 'industry': 'Developer Tools'},
            {'name': 'GitLab', 'domain': 'gitlab.com', 'industry': 'Developer Tools'},
            {'name': 'Redis', 'domain': 'redis.io', 'industry': 'Database'},
            {'name': 'MongoDB', 'domain': 'mongodb.com', 'industry': 'Database'},
            {'name': 'Databricks', 'domain': 'databricks.com', 'industry': 'Data Analytics'},
            {'name': 'Snowflake', 'domain': 'snowflake.com', 'industry': 'Data Warehouse'},
            {'name': 'McKinsey', 'domain': 'mckinsey.com', 'industry': 'Consulting'},
            {'name': 'BCG', 'domain': 'bcg.com', 'industry': 'Consulting'},
            {'name': 'Deloitte', 'domain': 'deloitte.com', 'industry': 'Consulting'},
            {'name': 'Accenture', 'domain': 'accenture.com', 'industry': 'Consulting'},
            {'name': 'Ford', 'domain': 'ford.com', 'industry': 'Automotive'},
            {'name': 'General Motors', 'domain': 'gm.com', 'industry': 'Automotive'},
            {'name': 'BMW', 'domain': 'bmw.com', 'industry': 'Automotive'},
            {'name': 'Toyota', 'domain': 'toyota.com', 'industry': 'Automotive'},
            {'name': 'Booking.com', 'domain': 'booking.com', 'industry': 'Travel'},
            {'name': 'Lyft', 'domain': 'lyft.com', 'industry': 'Transportation'},
            {'name': 'DoorDash', 'domain': 'doordash.com', 'industry': 'Food Delivery'},
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
            logo_keys = self.redis_client.keys("logo:*")
            return {
                "total_cached_logos": len(logo_keys),
                "redis_info": self.redis_client.info("memory"),
                "sample_keys": logo_keys[:10] if logo_keys else []
            }
        except Exception as e:
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
            services_status = {}
            fallback_services = [
                ("clearbit", "https://logo.clearbit.com/google.com"),
                ("iconhorse", "https://icon.horse/icon/google.com"),
                ("favicon", "https://www.google.com/s2/favicons?domain=google.com&sz=64")
            ]
            
            for service_name, test_url in fallback_services:
                try:
                    test_response = requests.head(test_url, timeout=3)
                    services_status[service_name] = "available" if test_response.status_code == 200 else "error"
                except:
                    services_status[service_name] = "unavailable"
            
            return {
                "current_service": self.service_config,
                "logodev_status": logodev_status,
                "services_status": services_status,
                "has_token": bool(self.logo_dev_token and self.logo_dev_token.strip()),
                "available_services": [
                    "auto", "logodev", "clearbit", "iconhorse", "favicon", "fallback"
                ]
            }
        except Exception as e:
            print(f"Error getting service config: {e}")
            return {
                "current_service": self.service_config,
                "error": str(e)
            }

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
