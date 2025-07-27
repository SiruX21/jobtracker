from flask import Blueprint, request, jsonify, redirect, url_for
from app.services.auth_service import verify_email_token, resend_verification_email

email_bp = Blueprint('email', __name__)

@email_bp.route("/verify-email", methods=["GET"])
def verify_email_page():
    """Handle email verification from email links"""
    token = request.args.get('token')
    
    if not token:
        return jsonify({"error": "Verification token is required"}), 400
    
    result = verify_email_token(token)
    
    if "error" in result:
        # In a real app, you might redirect to a frontend page with error message
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Email Verification Failed</h2>
                <p>{result["error"]}</p>
                <a href="http://localhost:3000" style="color: #2563eb;">Go to Login</a>
            </body>
        </html>
        """, result["code"]
    
    # Success - redirect to frontend with success message
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #16a34a;">Email Verified Successfully!</h2>
            <p>Your email has been verified. You can now log in to your account.</p>
            <a href="http://localhost:3000" style="color: #2563eb; text-decoration: none; background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px;">Go to Login</a>
        </body>
    </html>
    """