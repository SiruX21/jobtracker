from quart import Blueprint, request, jsonify, redirect, url_for, current_app
from app.services.auth_service import verify_email_token, resend_verification_email


email_bp = Blueprint('email', __name__)

@email_bp.route("/verify-email", methods=["GET"])
# Rate limiting temporarily disabled
async def verify_email_page():
    """Handle email verification from email links"""
    token = request.args.get('token')
    
    # --- Input Validation & Sanitization ---
    if not token or not isinstance(token, str) or len(token) > 500:
        return jsonify({"error": "Valid verification token is required"}), 400
    # --- End Validation ---
    
    result = verify_email_token(token)
    
    if "error" in result:
        # In a real app, you might redirect to a frontend page with error message
        from app.config import Config
        frontend_url = Config.get_frontend_url()
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Email Verification Failed</h2>
                <p>Email verification failed. Please try again or contact support.</p>
                <a href="{frontend_url}" style="color: #2563eb;">Go to Login</a>
            </body>
        </html>
        """, 400
    
    # Success - redirect to frontend with success message
    from app.config import Config
    frontend_url = Config.get_frontend_url()
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #16a34a;">Email Verified Successfully!</h2>
            <p>Your email has been verified. You can now log in to your account.</p>
            <a href="{frontend_url}" style="color: #2563eb; text-decoration: none; background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px;">Go to Login</a>
        </body>
    </html>
    """