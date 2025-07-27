# Job service functions
# Currently handled directly in routes/jobs.py
# This file is kept for future expansion

def validate_job_data(data):
    """Validate job application data"""
    required_fields = ['job_title', 'company_name']
    for field in required_fields:
        if not data.get(field):
            return f"{field.replace('_', ' ').title()} is required"
    return None