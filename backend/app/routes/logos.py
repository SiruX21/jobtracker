from flask import Blueprint, request, jsonify
from app.services.logo_cache_service import logo_cache

logos_bp = Blueprint('logos', __name__)

@logos_bp.route("/logos/company/<company_name>", methods=["GET"])
def get_company_logo(company_name):
    """Get cached company logo URL"""
    try:
        logo_url = logo_cache.get_logo_url(company_name)
        
        if logo_url:
            return jsonify({
                "company_name": company_name,
                "logo_url": logo_url,
                "cached": True
            })
        else:
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

@logos_bp.route("/logos/batch", methods=["POST"])
def get_batch_logos():
    """Get multiple company logos in one request"""
    try:
        data = request.get_json()
        company_names = data.get('companies', [])
        
        if not company_names:
            return jsonify({"error": "No company names provided"}), 400
        
        results = {}
        for company_name in company_names:
            logo_url = logo_cache.get_logo_url(company_name)
            results[company_name] = {
                "logo_url": logo_url,
                "cached": True
            }
        
        return jsonify({
            "results": results,
            "count": len(results)
        })
        
    except Exception as e:
        print(f"Error getting batch logos: {e}")
        return jsonify({"error": "Failed to get batch logos"}), 500

@logos_bp.route("/logos/validate/<company_name>", methods=["GET"])
def validate_company_logo(company_name):
    """Get and validate company logo URL"""
    try:
        logo_url = logo_cache.get_logo_with_validation(company_name)
        
        return jsonify({
            "company_name": company_name,
            "logo_url": logo_url,
            "validated": True
        })
        
    except Exception as e:
        print(f"Error validating logo for {company_name}: {e}")
        return jsonify({
            "error": "Failed to validate company logo",
            "company_name": company_name
        }), 500

@logos_bp.route("/logos/cache/clear", methods=["POST"])
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
def get_cache_stats():
    """Get cache statistics"""
    try:
        stats = logo_cache.get_cache_stats()
        return jsonify(stats)
        
    except Exception as e:
        print(f"Error getting cache stats: {e}")
        return jsonify({"error": "Failed to get cache stats"}), 500

@logos_bp.route("/logos/health", methods=["GET"])
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
