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
    
    subject = "Verify Your Email Address"
    body = f"""
    Hello,
    
    Please click the following link to verify your email address:
    
    http://localhost:5173/verify-email?token={token}
    
    This link will expire in 24 hours.
    
    If you did not create an account, please ignore this email.
    
    Best regards,
    Job Tracker Team
    """
    
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = user_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        print("--- Sending Verification Email ---", flush=True)
        print(f"SMTP Server: {smtp_server}:{smtp_port}", flush=True)
        print(f"SMTP Username: {smtp_username}", flush=True)
        print(f"Recipient: {user_email}", flush=True)
        print(f"Subject: {subject}", flush=True)
        print(f"Body:\n{body}", flush=True)

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
    
    subject = "Reset Your Password"
    body = f"""
    Hello,
    
    You have requested to reset your password. Please click the following link to reset your password:
    
    http://localhost:5173/reset-password?token={token}
    
    This link will expire in 1 hour.
    
    If you did not request a password reset, please ignore this email. Your password will remain unchanged.
    
    Best regards,
    Job Tracker Team
    """
    
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = user_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
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

def send_password_reset_email(email, reset_token):
    """Send password reset email (for future implementation)"""
    # TODO: Implement password reset functionality
    pass