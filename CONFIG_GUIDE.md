# Job Tracker Configuration Guide

## Quick Start

1. **Copy the example configuration:**
   ```bash
   cp docker-compose-example.yml docker-compose.yml
   ```

2. **Edit your configuration:**
   ```bash
   nano docker-compose.yml  # or use your preferred editor
   ```

3. **Update required values:**
   - Change `SECRET_KEY` to a secure random string
   - Change `DB_PASSWORD` and `MARIADB_ROOT_PASSWORD`
   - Update email configuration with your provider settings

4. **Start the application:**
   ```bash
   docker-compose up --build -d
   ```

## Configuration System

This project uses **docker-compose.yml** for all environment configuration. No `.env` files are used - all settings are directly in the docker-compose file.

### Why Docker Compose Configuration?

- ✅ **Single source of truth** - All configuration in one file
- ✅ **No environment file management** - Eliminates `.env` file complexity
- ✅ **Container-specific settings** - Different services can have different configs
- ✅ **Production ready** - Easy to deploy with CI/CD systems
- ✅ **Version controlled** - Configuration can be tracked (when not ignored)

### Configuration Structure

The `docker-compose.yml` file contains three services:

#### 1. Database Service (`db`)
```yaml
db:
  image: mariadb:latest
  environment:
    MARIADB_ROOT_PASSWORD: example  # CHANGE THIS
    MARIADB_DATABASE: auth_db
```

#### 2. Backend Service (`backend`)
```yaml
backend:
  environment:
    # Environment
    - ENVIRONMENT=development
    - DEBUG=True
    
    # URLs
    - FRONTEND_URL=http://localhost:5173
    - BACKEND_URL=http://localhost:5000
    
    # Security
    - SECRET_KEY=your-secret-key  # CHANGE THIS
    
    # Database
    - DB_HOST=db
    - DB_PASSWORD=example  # CHANGE THIS
    
    # Email
    - MAIL_SERVER=smtp.zoho.com
    - MAIL_USERNAME=your-email@domain.com  # CHANGE THIS
    - MAIL_PASSWORD=your-password  # CHANGE THIS
```

#### 3. Frontend Service (`frontend`)
```yaml
frontend:
  environment:
    - VITE_API_BASE_URL=http://localhost:5000
    - VITE_APP_NAME=Job Tracker
```

## Required Configuration Changes

### 🔒 Security (CRITICAL)

1. **SECRET_KEY**: Generate a secure random string
   ```bash
   # Generate a secure key:
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Database Password**: Change from default
   ```yaml
   # Backend service
   - DB_PASSWORD=your-secure-db-password
   
   # Database service
   MARIADB_ROOT_PASSWORD: your-secure-db-password
   ```

### 📧 Email Configuration

Choose your email provider and update accordingly:

#### Gmail
```yaml
- MAIL_SERVER=smtp.gmail.com
- MAIL_PORT=587
- MAIL_USE_TLS=True
- MAIL_USERNAME=your-email@gmail.com
- MAIL_PASSWORD=your-app-password  # Use App Password, not regular password
```

#### Outlook/Hotmail
```yaml
- MAIL_SERVER=smtp-mail.outlook.com
- MAIL_PORT=587
- MAIL_USE_TLS=True
- MAIL_USERNAME=your-email@outlook.com
- MAIL_PASSWORD=your-password
```

#### Zoho (Current Example)
```yaml
- MAIL_SERVER=smtp.zoho.com
- MAIL_PORT=465
- MAIL_USE_TLS=False
- MAIL_USERNAME=your-email@domain.com
- MAIL_PASSWORD=your-password
```

## Development vs Production

### Development Setup (Default)
```yaml
- ENVIRONMENT=development
- DEBUG=True
- FRONTEND_URL=http://localhost:5173
- BACKEND_URL=http://localhost:5000
- CORS_ORIGINS=http://localhost:5173
```

### Production Setup
```yaml
- ENVIRONMENT=production
- DEBUG=False
- DOMAIN=your-domain.com
- FRONTEND_URL=https://your-domain.com
- BACKEND_URL=https://api.your-domain.com
- CORS_ORIGINS=https://your-domain.com
```

For production:
1. Update all domain-related URLs
2. Use HTTPS URLs
3. Set DEBUG=False
4. Use production-grade database credentials
5. Configure proper CORS origins

## Security Best Practices

### 🚫 Never Commit Sensitive Data
The `docker-compose.yml` file is in `.gitignore` to prevent accidentally committing:
- Database passwords
- Email passwords
- Secret keys
- Production URLs

### 🔐 Use Strong Credentials
- Generate secure random passwords for database
- Use app passwords for email providers (when required)
- Create a strong SECRET_KEY (32+ characters)

### 🌐 CORS Configuration
Update `CORS_ORIGINS` to include only trusted domains:
```yaml
# Development
- CORS_ORIGINS=http://localhost:5173

# Production
- CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## Application Features

### Backend API Endpoints
- `POST /auth/register` - User registration with email verification
- `POST /auth/login` - User login with JWT tokens
- `GET /auth/verify-email` - Email verification
- `GET /auth/profile` - Get user profile
- `PUT /auth/change-password` - Change user password
- `GET /jobs` - Get user's job applications
- `POST /jobs` - Create new job application
- `PUT /jobs/{id}` - Update job application
- `DELETE /jobs/{id}` - Delete job application

### Frontend Features
- **Authentication System** - Secure registration and login
- **Settings Page** - Profile management and password changes
- **Developer Mode** - Cache inspection and data export tools
- **Job Tracking** - Add, edit, and manage job applications
- **Real-time Sync** - All data persists to database
- **Responsive Design** - Works on desktop and mobile

## Deployment Commands

### Start Services
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes database)
docker-compose down -v
```

### Update Application
```bash
# Rebuild after code changes
docker-compose up --build -d

# Rebuild specific service
docker-compose up --build -d backend
```

## Troubleshooting

### Common Issues

#### 🚫 CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: Check `CORS_ORIGINS` matches your frontend URL exactly

#### 📧 Email Not Sending
**Problem**: Email verification not working
**Solution**: 
1. Check email provider settings
2. Verify credentials are correct
3. Use app passwords for Gmail/Yahoo
4. Check firewall/network restrictions

#### 🗄️ Database Connection Errors
**Problem**: Backend can't connect to database
**Solution**:
1. Ensure database service is running: `docker-compose ps`
2. Check database credentials match between services
3. Wait for database to fully initialize (can take 30+ seconds)

#### 🔐 Authentication Issues
**Problem**: Login not working or tokens invalid
**Solution**:
1. Check SECRET_KEY is set and consistent
2. Clear browser cookies/localStorage
3. Check backend logs for specific errors

### Debug Commands
```bash
# View backend logs
docker-compose logs backend

# View database logs
docker-compose logs db

# Access backend container
docker-compose exec backend /bin/bash

# Access database
docker-compose exec db mysql -u root -p auth_db
```

## Support

If you encounter issues:
1. Check this configuration guide
2. Review docker-compose logs
3. Verify all required configuration changes are made
4. Ensure sensitive credentials are properly set
