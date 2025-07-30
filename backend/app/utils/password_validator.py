import re
from typing import Dict, List, Tuple

class PasswordValidator:
    """
    Comprehensive password validation utility
    """
    
    @staticmethod
    def validate_password(password: str) -> Tuple[bool, Dict[str, any]]:
        """
        Validate password against security requirements
        
        Returns:
            Tuple[bool, Dict]: (is_valid, validation_details)
        """
        if not password:
            return False, {
                "valid": False,
                "score": 0,
                "feedback": "Password is required",
                "requirements": {
                    "length": False,
                    "uppercase": False,
                    "lowercase": False,
                    "number": False,
                    "special": False
                },
                "errors": ["Password is required"]
            }
        
        # Define requirements
        requirements = {
            "length": len(password) >= 8,
            "uppercase": bool(re.search(r'[A-Z]', password)),
            "lowercase": bool(re.search(r'[a-z]', password)),
            "number": bool(re.search(r'\d', password)),
            "special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
        }
        
        # Calculate score
        score = sum(requirements.values())
        
        # Determine validity (minimum requirements)
        min_requirements_met = (
            requirements["length"] and 
            requirements["lowercase"] and
            (requirements["uppercase"] or requirements["number"] or requirements["special"])
        )
        
        # Generate feedback
        if score <= 2:
            feedback = "Weak password"
        elif score <= 3:
            feedback = "Fair password" 
        elif score <= 4:
            feedback = "Good password"
        else:
            feedback = "Strong password"
        
        # Generate error messages
        errors = []
        if not requirements["length"]:
            errors.append("Password must be at least 8 characters long")
        if not requirements["lowercase"]:
            errors.append("Password must contain at least one lowercase letter")
        if not (requirements["uppercase"] or requirements["number"] or requirements["special"]):
            errors.append("Password must contain at least one uppercase letter, number, or special character")
        
        return min_requirements_met, {
            "valid": min_requirements_met,
            "score": score,
            "feedback": feedback,
            "requirements": requirements,
            "errors": errors if not min_requirements_met else []
        }
    
    @staticmethod
    def get_password_strength_rules() -> Dict[str, str]:
        """
        Get human-readable password strength rules
        """
        return {
            "length": "At least 8 characters long",
            "uppercase": "Contains uppercase letters (A-Z)",
            "lowercase": "Contains lowercase letters (a-z)", 
            "number": "Contains numbers (0-9)",
            "special": "Contains special characters (!@#$%^&*)"
        }
