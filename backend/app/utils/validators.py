import re

def validate_email(email):
    """Validate email format using basic regex"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password requirements"""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Za-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    return True

def validate_username(username):
    if len(username) < 3 or len(username) > 20:
        return False
    if not re.match("^[a-zA-Z0-9_.-]+$", username):
        return False
    return True

def validate_job_application(data):
    """Validate job application data"""
    required_fields = ['job_title', 'company_name']
    
    for field in required_fields:
        if not data.get(field):
            return f"{field.replace('_', ' ').title()} is required"
    
    # Optional: Validate status if provided
    valid_statuses = ['Applied', 'Interview', 'Rejected', 'Offer', 'Accepted']
    if 'status' in data and data['status'] not in valid_statuses:
        return f"Status must be one of: {', '.join(valid_statuses)}"
    
    return None