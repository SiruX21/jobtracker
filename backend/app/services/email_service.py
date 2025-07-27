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
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    if not all([smtp_server, smtp_username, smtp_password]):
        print("Email configuration missing")
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

        print("--- Sending Verification Email ---")
        print(f"SMTP Server: {smtp_server}:{smtp_port}")
        print(f"SMTP Username: {smtp_username}")
        print(f"Recipient: {user_email}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}")

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, user_email, text)
        server.quit()

        print(f"Verification email sent to {user_email}")
        print("--- Email Send Complete ---")
        return True

    except Exception as e:
        print(f"Failed to send verification email: {e}")
        print("--- Email Send Failed ---")
        return False

def send_password_reset_email(user_email, token):
    """Send password reset token to user"""
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
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