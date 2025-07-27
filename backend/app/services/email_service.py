import smtplib
import os
from email.message import EmailMessage
from ..config import Config

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import Config
import os

def send_verification_email(user_email, token):
    """Send email verification token to user"""
    smtp_server = os.getenv('MAIL_SERVER')
    smtp_port = int(os.getenv('MAIL_PORT', 587))
    smtp_username = os.getenv('MAIL_USERNAME')
    smtp_password = os.getenv('MAIL_PASSWORD')
    
    print(f"[EMAIL CONFIG] MAIL_SERVER: {smtp_server}", flush=True)
    print(f"[EMAIL CONFIG] MAIL_PORT: {smtp_port}", flush=True)
    print(f"[EMAIL CONFIG] MAIL_USERNAME: {smtp_username}", flush=True)
    print(f"[EMAIL CONFIG] MAIL_PASSWORD: {'***' if smtp_password else 'None'}", flush=True)
    
    if not all([smtp_server, smtp_username, smtp_password]):
        print("Email configuration missing", flush=True)
        return False
    
    # Get frontend URL from environment or default to localhost
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    verification_link = f"{frontend_url}/verify-email?token={token}"
    
    subject = "Verify Your Email Address"
    
    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Job Tracker!</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }}
            .container {{
                background: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .title {{
                color: #4f46e5;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }}
            .content {{
                margin-bottom: 30px;
                color: #6b7280;
                font-size: 16px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .verify-button {{
                display: inline-block;
                background-color: #4f46e5;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                transition: background-color 0.3s;
            }}
            .verify-button:hover {{
                background-color: #4338ca;
            }}
            .alternative-link {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
            }}
            .link {{
                color: #4f46e5;
                word-break: break-all;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #9ca3af;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">Welcome to Job Tracker!</h1>
            </div>
            
            <div class="content">
                <p>Thank you for registering with Job Tracker. To complete your registration, please verify your email address by clicking the button below:</p>
            </div>
            
            <div class="button-container">
                <a href="{verification_link}" class="verify-button">Verify Email Address</a>
            </div>
            
            <div class="alternative-link">
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p><a href="{verification_link}" class="link">{verification_link}</a></p>
            </div>
            
            <div class="footer">
                <p>This verification link will expire in 24 hours. If you didn't create an account with Job Tracker, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text fallback
    text_body = f"""
    Welcome to Job Tracker!
    
    Thank you for registering with Job Tracker. To complete your registration, please verify your email address by clicking the following link:
    
    {verification_link}
    
    This link will expire in 24 hours.
    
    If you didn't create an account with Job Tracker, you can safely ignore this email.
    
    Best regards,
    Job Tracker Team
    """
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_username
        msg['To'] = user_email
        msg['Subject'] = subject
        
        # Attach both plain text and HTML versions
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        print("--- Sending Verification Email ---", flush=True)
        print(f"SMTP Server: {smtp_server}:{smtp_port}", flush=True)
        print(f"SMTP Username: {smtp_username}", flush=True)
        print(f"Recipient: {user_email}", flush=True)
        print(f"Subject: {subject}", flush=True)
        print(f"Verification Link: {verification_link}", flush=True)

        # Use SMTP_SSL for port 465 (SSL), or SMTP with starttls for port 587 (TLS)
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, user_email, text)
        server.quit()

        print(f"Verification email sent to {user_email}", flush=True)
        print("--- Email Send Complete ---", flush=True)
        return True

    except Exception as e:
        print(f"Failed to send verification email: {e}", flush=True)
        print("--- Email Send Failed ---", flush=True)
        return False

def send_password_reset_email(user_email, token):
    """Send password reset token to user"""
    smtp_server = os.getenv('MAIL_SERVER')
    smtp_port = int(os.getenv('MAIL_PORT', 587))
    smtp_username = os.getenv('MAIL_USERNAME')
    smtp_password = os.getenv('MAIL_PASSWORD')
    
    if not all([smtp_server, smtp_username, smtp_password]):
        print("Email configuration missing")
        return False
    
    # Get frontend URL from environment or default to localhost
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    subject = "Reset Your Password"
    
    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Job Tracker</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
            }}
            .container {{
                background: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .title {{
                color: #dc2626;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }}
            .content {{
                margin-bottom: 30px;
                color: #6b7280;
                font-size: 16px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .reset-button {{
                display: inline-block;
                background-color: #dc2626;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                transition: background-color 0.3s;
            }}
            .reset-button:hover {{
                background-color: #b91c1c;
            }}
            .alternative-link {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
            }}
            .link {{
                color: #dc2626;
                word-break: break-all;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #9ca3af;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="title">Reset Your Password</h1>
            </div>
            
            <div class="content">
                <p>You have requested to reset your password for your Job Tracker account. Click the button below to create a new password:</p>
            </div>
            
            <div class="button-container">
                <a href="{reset_link}" class="reset-button">Reset Password</a>
            </div>
            
            <div class="alternative-link">
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p><a href="{reset_link}" class="link">{reset_link}</a></p>
            </div>
            
            <div class="footer">
                <p>This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text fallback
    text_body = f"""
    Reset Your Password - Job Tracker
    
    You have requested to reset your password for your Job Tracker account. Please click the following link to create a new password:
    
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    
    Best regards,
    Job Tracker Team
    """
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_username
        msg['To'] = user_email
        msg['Subject'] = subject
        
        # Attach both plain text and HTML versions
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Use SMTP_SSL for port 465 (SSL), or SMTP with starttls for port 587 (TLS)
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, user_email, text)
        server.quit()
        
        print(f"Password reset email sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
        return False