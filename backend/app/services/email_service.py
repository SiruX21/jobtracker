import smtplib
import os
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import Config

def send_verification_email(user_email, token):
    """Send email verification token to user"""
    smtp_server = os.getenv('MAIL_SERVER')
    smtp_port = int(os.getenv('MAIL_PORT', 587))
    smtp_username = os.getenv('MAIL_USERNAME')
    smtp_password = os.getenv('MAIL_PASSWORD')
    
    Config.log_debug(f"Email config - Server: {smtp_server}, Port: {smtp_port}, Username: {smtp_username}", 'email')
    Config.log_debug(f"Password configured: {'Yes' if smtp_password else 'No'}", 'email')
    
    if not all([smtp_server, smtp_username, smtp_password]):
        Config.log_error("Email configuration missing", 'email')
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
        
        Config.log_info(f"Password reset email sent to {user_email}", 'email')
        return True
        
    except Exception as e:
        Config.log_error(f"Failed to send password reset email: {e}", 'email')
        return False

def send_email_change_confirmation(user_email, token):
    """Send confirmation email to current email for email change request"""
    smtp_server = os.getenv('MAIL_SERVER')
    smtp_port = int(os.getenv('MAIL_PORT', 587))
    smtp_username = os.getenv('MAIL_USERNAME')
    smtp_password = os.getenv('MAIL_PASSWORD')
    
    if not all([smtp_server, smtp_username, smtp_password]):
        print("Email configuration missing")
        return False
    
    # Get frontend URL for confirmation link
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    confirmation_link = f"{frontend_url}/confirm-email-change?token={token}"
    
    subject = "Confirm Email Change Request"
    
    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Email Change</title>
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
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .logo {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                margin-bottom: 20px;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: 600;
                text-align: center;
            }}
            .warning {{
                background: #fef3cd;
                border: 1px solid #faebcd;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                color: #856404;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📧</div>
                <h1 style="color: #2d3748; margin: 0;">Confirm Email Change</h1>
            </div>
            
            <p>Hello,</p>
            
            <p>We received a request to change the email address associated with your Job Tracker account.</p>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you did not request this email change, please ignore this email and consider changing your password.
            </div>
            
            <p>To proceed with the email change, click the button below:</p>
            
            <div style="text-align: center;">
                <a href="{confirmation_link}" class="button">Confirm Email Change</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f7fafc; padding: 10px; border-radius: 4px; font-family: monospace;">
                {confirmation_link}
            </p>
            
            <p><strong>This confirmation link will expire in 1 hour.</strong></p>
            
            <p>After confirming, you'll be asked to provide your new email address.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #718096;">
                Best regards,<br>
                Job Tracker Team
            </p>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_body = f"""
    Confirm Email Change Request
    
    Hello,
    
    We received a request to change the email address associated with your Job Tracker account.
    
    SECURITY NOTICE: If you did not request this email change, please ignore this email and consider changing your password.
    
    To proceed with the email change, visit this link:
    {confirmation_link}
    
    This confirmation link will expire in 1 hour.
    
    After confirming, you'll be asked to provide your new email address.
    
    Best regards,
    Job Tracker Team
    """
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_username
        msg['To'] = user_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, user_email, text)
        server.quit()
        
        print(f"Email change confirmation sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send email change confirmation: {e}")
        return False

def send_new_email_verification(new_email, token):
    """Send verification email to new email address"""
    smtp_server = os.getenv('MAIL_SERVER')
    smtp_port = int(os.getenv('MAIL_PORT', 587))
    smtp_username = os.getenv('MAIL_USERNAME')
    smtp_password = os.getenv('MAIL_PASSWORD')
    
    if not all([smtp_server, smtp_username, smtp_password]):
        print("Email configuration missing")
        return False
    
    # Get frontend URL for verification link
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    verification_link = f"{frontend_url}/verify-new-email?token={token}"
    
    subject = "Verify Your New Email Address"
    
    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify New Email</title>
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
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .logo {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                margin-bottom: 20px;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: 600;
                text-align: center;
            }}
            .success {{
                background: #d1f2eb;
                border: 1px solid #a7f3d0;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                color: #065f46;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">✉️</div>
                <h1 style="color: #2d3748; margin: 0;">Verify Your New Email</h1>
            </div>
            
            <p>Hello,</p>
            
            <p>Please verify this email address to complete your email change for your Job Tracker account.</p>
            
            <div class="success">
                <strong>✅ Almost Done!</strong> Just one more step to complete your email change.
            </div>
            
            <p>Click the button below to verify this email address:</p>
            
            <div style="text-align: center;">
                <a href="{verification_link}" class="button">Verify New Email</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f7fafc; padding: 10px; border-radius: 4px; font-family: monospace;">
                {verification_link}
            </p>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            
            <p>Once verified, this will become your new login email address.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #718096;">
                Best regards,<br>
                Job Tracker Team
            </p>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_body = f"""
    Verify Your New Email Address
    
    Hello,
    
    Please verify this email address to complete your email change for your Job Tracker account.
    
    Click this link to verify your new email address:
    {verification_link}
    
    This verification link will expire in 24 hours.
    
    Once verified, this will become your new login email address.
    
    Best regards,
    Job Tracker Team
    """
    
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_username
        msg['To'] = new_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, new_email, text)
        server.quit()
        
        print(f"New email verification sent to {new_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send new email verification: {e}")
        return False