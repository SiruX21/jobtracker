from flask import Blueprint, request, jsonify, Response, current_app
from app.services.logo_cache_service import logo_cache

# Rate limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

logos_bp = Blueprint('logos', __name__)

# Attach limiter to blueprint (if not already done in app factory)
def get_limiter():
    if not hasattr(current_app, 'limiter'):
        # Fallback: create a limiter if not present (for blueprint testing)
        return Limiter(key_func=get_remote_address, app=current_app)
    return current_app.limiter

# Helper to apply per-IP rate limit
def ip_rate_limit(limit):
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def wrapped(*args, **kwargs):
            return f(*args, **kwargs)
        wrapped.__name__ = f.__name__
        return get_limiter().limit(limit, key_func=get_remote_address)(wrapped)
    return decorator

@logos_bp.route("/logos/company/<company_name>", methods=["GET"])
@ip_rate_limit("60 per minute")
def get_company_logo(company_name):
    """Get cached company logo image"""
    # --- Input Validation & Sanitization ---
    if not company_name or not isinstance(company_name, str) or len(company_name) > 100:
        return jsonify({"error": "Invalid company name"}), 400
    # --- End Validation ---
    
    try:
        image_data, content_type = logo_cache.get_logo_data(company_name)
        
        if image_data:
            return Response(
                image_data,
                mimetype=content_type,
                headers={
                    'Cache-Control': 'public, max-age=86400',  # Cache for 1 day
                    'Content-Disposition': f'inline; filename="{company_name}_logo"'
                }
            )
        else:
            # Return a placeholder or 404
            return jsonify({
                "error": "Logo not found",
                "company_name": company_name
            }), 404
            
    except Exception as e:
        print(f"Error getting logo for {company_name}: {e}")
        return jsonify({
            "error": "Failed to get company logo",
            "company_name": company_name
        }), 500

@logos_bp.route("/logos/url/<company_name>", methods=["GET"])
@ip_rate_limit("60 per minute")
def get_company_logo_url(company_name):
    """Get company logo URL for API responses (returns internal URL)"""
    # --- Input Validation & Sanitization ---
    if not company_name or not isinstance(company_name, str) or len(company_name) > 100:
        return jsonify({"error": "Invalid company name"}), 400
    # --- End Validation ---
    
    try:
        # Check if we have the image cached
        image_data, content_type = logo_cache.get_logo_data(company_name)
        
        if image_data:
            # Return our internal URL (no API token exposed)
            logo_url = f"/api/logos/company/{company_name}"
            return jsonify({
                "company_name": company_name,
                "logo_url": logo_url,
                "cached": True,
                "content_type": content_type
            })
        else:
            return jsonify({
                "error": "Logo not found",
                "company_name": company_name
            }), 404
            
    except Exception as e:
        print(f"Error getting logo URL for {company_name}: {e}")
        return jsonify({
            "error": "Failed to get company logo URL",
            "company_name": company_name
        }), 500

@logos_bp.route("/logos/search", methods=["GET"])
@ip_rate_limit("30 per minute")
def search_companies():
    """Search for companies with autocomplete"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 10))
        
        if not query or len(query) < 2:
            return jsonify({
                "results": [],
                "query": query,
                "message": "Query must be at least 2 characters"
            })
        
        results = logo_cache.search_companies(query, limit)
        
        return jsonify({
            "results": results,
            "query": query,
            "count": len(results)
        })
        
    except Exception as e:
        print(f"Error searching companies: {e}")
        return jsonify({
            "error": "Failed to search companies",
            "query": request.args.get('q', '')
        }), 500

@logos_bp.route("/logos/batch", methods=["POST"])
@ip_rate_limit("10 per minute")
def get_batch_logos():
    """Get multiple company logo URLs in one request"""
    try:
        data = request.get_json()
        company_names = data.get('companies', [])
        
        if not company_names:
            return jsonify({"error": "No company names provided"}), 400
        
        results = {}
        for company_name in company_names:
            # Pre-cache the image (async download)
            image_data, content_type = logo_cache.get_logo_data(company_name)
            
            if image_data:
                results[company_name] = {
                    "logo_url": f"/api/logos/company/{company_name}",
                    "content_type": content_type,
                    "cached": True
                }
            else:
                results[company_name] = {
                    "logo_url": None,
                    "cached": False,
                    "error": "Logo not found"
                }
        
        return jsonify({
            "results": results,
            "count": len(results)
        })
        
    except Exception as e:
        print(f"Error getting batch logos: {e}")
        return jsonify({"error": "Failed to get batch logos"}), 500

@logos_bp.route("/logos/validate/<company_name>", methods=["GET"])
@ip_rate_limit("20 per minute")
def validate_company_logo(company_name):
    """Get and validate company logo"""
    try:
        image_data, content_type = logo_cache.get_logo_data(company_name)
        
        return jsonify({
            "company_name": company_name,
            "logo_url": f"/api/logos/company/{company_name}" if image_data else None,
            "content_type": content_type,
            "validated": image_data is not None,
            "cached": image_data is not None
        })
        
    except Exception as e:
        print(f"Error validating logo for {company_name}: {e}")
        return jsonify({
            "error": "Failed to validate company logo",
            "company_name": company_name
        }), 500

@logos_bp.route("/logos/cache/clear", methods=["POST"])
@ip_rate_limit("5 per minute")
def clear_logo_cache():
    """Clear logo cache (admin endpoint)"""
    try:
        data = request.get_json() or {}
        company_name = data.get('company_name')
        
        logo_cache.clear_cache(company_name)
        
        if company_name:
            return jsonify({"message": f"Cache cleared for {company_name}"})
        else:
            return jsonify({"message": "All logo cache cleared"})
            
    except Exception as e:
        print(f"Error clearing cache: {e}")
        return jsonify({"error": "Failed to clear cache"}), 500

@logos_bp.route("/logos/cache/stats", methods=["GET"])
@ip_rate_limit("20 per minute")
def get_cache_stats():
    """Get cache statistics"""
    try:
        stats = logo_cache.get_cache_stats()
        return jsonify(stats)
        
    except Exception as e:
        print(f"Error getting cache stats: {e}")
        return jsonify({"error": "Failed to get cache stats"}), 500

@logos_bp.route("/logos/health", methods=["GET"])
@ip_rate_limit("30 per minute")
def logo_service_health():
    """Check logo service health"""
    try:
        # Test Redis connection
        if logo_cache.redis_client:
            logo_cache.redis_client.ping()
            redis_status = "connected"
        else:
            redis_status = "disconnected"
        
        return jsonify({
            "status": "healthy" if redis_status == "connected" else "degraded",
            "redis": redis_status,
            "service": "logo_cache"
        })
        
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "redis": "error",
            "error": str(e),
            "service": "logo_cache"
        }), 500

@logos_bp.route("/logos/config", methods=["GET", "POST"])
@ip_rate_limit("10 per minute")
def logo_service_config():
    """Get or set logo service configuration"""
    try:
        if request.method == "GET":
            # Get current configuration
            config = logo_cache.get_service_config()
            return jsonify(config)
        
        elif request.method == "POST":
            # Set configuration
            data = request.get_json()
            service_type = data.get('service_type', 'auto')
            
            # Validate service type
            valid_services = ['auto', 'logodev', 'clearbit', 'iconhorse', 'favicon', 'fallback']
            if service_type not in valid_services:
                return jsonify({"error": "Invalid service type"}), 400
            
            # Update configuration
            result = logo_cache.set_service_config(service_type)
            return jsonify(result)
            
    except Exception as e:
        print(f"Error handling logo config: {e}")
        return jsonify({"error": "Failed to handle logo configuration"}), 500
