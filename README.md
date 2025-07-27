# Job Tracker Application

A full-stack job application tracking system built with Flask (backend) and React (frontend) with email verification functionality.

## Features

- **User Authentication**: Register, login with email verification
- **Email Verification**: Secure email verification system using tokens
- **Job Tracking**: Add, view, edit, and delete job applications
- **User-specific Data**: Each user can only see their own job applications
- **Responsive UI**: Built with React and Tailwind CSS
- **Secure**: JWT-based authentication with proper token validation

## Tech Stack

### Backend
- **Flask**: Python web framework
- **MariaDB**: Database for storing users and job applications
- **JWT**: For secure authentication tokens
- **SMTP**: Email verification system
- **Docker**: Containerization

### Frontend
- **React**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **React Router**: Navigation
- **Axios**: API requests

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Hashed password
- `email_verified`: Boolean verification status
- `verification_token`: Temporary verification token
- `verification_token_expires`: Token expiration timestamp

### Job Applications Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `job_title`: Job position title
- `company_name`: Company name
- `application_date`: Date applied
- `status`: Application status (Applied, Interview, Rejected, Offer, Accepted)
- `job_url`: Link to job posting
- `notes`: Additional notes
- `location`: Job location

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Email account for verification (Gmail, Outlook, Zoho, etc.)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd jobtracker
```

### 2. Configure Application
```bash
# Copy the example configuration
cp docker-compose-example.yml docker-compose.yml

# Edit the configuration file with your settings
nano docker-compose.yml  # or use your preferred editor
```

**Required Changes:**
- Change `SECRET_KEY` to a secure random string
- Update database passwords (`DB_PASSWORD` and `MARIADB_ROOT_PASSWORD`)
- Configure email settings for your provider
- Update email username and password

### 3. Start the Application
```bash
# Build and start all services
docker-compose up --build -d

# View logs (optional)
docker-compose logs -f
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Database**: MariaDB running internally

## Configuration

This project uses `docker-compose.yml` for all configuration. No `.env` files are required.

### Security Configuration (REQUIRED)
```yaml
# Generate a secure secret key:
# python -c "import secrets; print(secrets.token_urlsafe(32))"
- SECRET_KEY=your-generated-secret-key

# Use strong database credentials
- DB_PASSWORD=your-secure-password
MARIADB_ROOT_PASSWORD: your-secure-password
```

### Email Configuration
Update these settings in `docker-compose.yml` based on your email provider:

#### Gmail
```yaml
- MAIL_SERVER=smtp.gmail.com
- MAIL_PORT=587
- MAIL_USE_TLS=True
- MAIL_USERNAME=your-email@gmail.com
- MAIL_PASSWORD=your-app-password  # Use App Password, not regular password
```

#### Outlook
```yaml
- MAIL_SERVER=smtp-mail.outlook.com
- MAIL_PORT=587
- MAIL_USE_TLS=True
- MAIL_USERNAME=your-email@outlook.com
- MAIL_PASSWORD=your-password
```

#### Other Providers
See [CONFIG_GUIDE.md](CONFIG_GUIDE.md) for more email provider configurations.

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /verify-email?token=<token>` - Verify email
- `POST /resend-verification` - Resend verification email
- `GET /profile` - Get user profile (requires auth)

### Job Applications
- `GET /jobs` - Get user's job applications (requires auth)
- `POST /jobs` - Create new job application (requires auth)
- `GET /jobs/<id>` - Get specific job application (requires auth)
- `PUT /jobs/<id>` - Update job application (requires auth)
- `DELETE /jobs/<id>` - Delete job application (requires auth)

## Email Verification Flow

1. **User Registration**: User registers with email/password
2. **Email Sent**: System sends verification email with secure token
3. **User Clicks Link**: Email contains link to `/verify-email?token=<token>`
4. **Verification**: Backend validates token and marks email as verified
5. **Login Enabled**: User can now log in with verified account

## Development

### Full Stack Development (Recommended)
```bash
# Start all services with Docker
cp docker-compose-example.yml docker-compose.yml
# Edit docker-compose.yml with your settings
docker-compose up --build -d
```

### Backend Development Only
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables manually or use a local .env file
export SECRET_KEY="your-secret-key"
export DB_HOST="localhost"
# ... other variables

python run.py
```

### Frontend Development Only
```bash
cd front-end
npm install

# Update VITE_API_BASE_URL in docker-compose.yml or set manually:
export VITE_API_BASE_URL="http://localhost:5000"

npm run dev
```

## Security Features

- **Password Hashing**: bcrypt password hashing with salt
- **JWT Tokens**: Secure authentication tokens with expiration
- **Email Verification**: Prevents fake email registrations
- **User Isolation**: Users can only access their own data
- **CORS Protection**: Configurable CORS origins
- **SQL Injection Protection**: Parameterized queries
- **Secure Configuration**: Sensitive data in docker-compose.yml (gitignored)

## Configuration Reference

All configuration is done in `docker-compose.yml`. Key settings:

### Backend Environment Variables
- `SECRET_KEY`: Flask secret key (**REQUIRED** - generate secure random string)
- `DB_*`: Database connection settings
- `MAIL_*`: Email provider configuration
- `FRONTEND_URL`: Frontend URL for email verification links
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)

### Frontend Environment Variables
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_APP_NAME`: Application display name

## Troubleshooting

### Email Not Sending
1. Check email provider settings in `docker-compose.yml`
2. For Gmail: Enable 2FA and generate App Password (not regular password)
3. Verify email credentials are correct
4. Check backend logs: `docker-compose logs backend`

### Database Connection Issues
1. Ensure MariaDB container is running: `docker-compose ps`
2. Check database logs: `docker-compose logs db`
3. Verify database credentials match between backend and db services
4. Wait for database initialization (can take 30+ seconds on first run)

### Frontend API Issues
1. Check backend is running: `docker-compose ps`
2. Verify `VITE_API_BASE_URL` matches backend URL
3. Check CORS settings in backend match frontend URL
4. Check browser network tab for API call details

### Configuration Issues
1. Ensure `docker-compose.yml` exists (copy from `docker-compose-example.yml`)
2. Verify all required fields are updated (SECRET_KEY, passwords, email)
3. Check for typos in environment variable names
4. Restart containers after configuration changes: `docker-compose restart`

## Production Deployment

### Pre-deployment Checklist
1. **Security**:
   ```bash
   # Generate strong secret key
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   
2. **Configuration**:
   - Set `ENVIRONMENT=production`
   - Set `DEBUG=False`
   - Update domain URLs for production
   - Use production database credentials
   - Configure production email settings

3. **Infrastructure**:
   - Set up reverse proxy (nginx) for HTTPS
   - Configure SSL certificates
   - Set up database backups
   - Use persistent volumes for data

### Deployment Commands
```bash
# Production deployment
docker-compose up -d --build

# View production logs
docker-compose logs -f

# Backup database
docker-compose exec db mysqldump -u root -p auth_db > backup.sql
```

## Documentation

- **[CONFIG_GUIDE.md](CONFIG_GUIDE.md)** - Detailed configuration guide
- **[docker-compose-example.yml](docker-compose-example.yml)** - Configuration template

## License

This project is open source and available under the [MIT License](LICENSE).

- something to track your intern/job applications
- uses fancy tech stack blah blah blah
- in theory should use account authentication and creation but we shall find out
- in theory should also be a proof of concept for a lot of what i know in a neat full stack project
- god forbid design we don't need that

# Stuff this project currently shows off
- nothing
- github actions working properly with my own self-hosted server
- ssl working properly on my website on both ends, check it out [here](https://job.siru.dev)
- i hope this shows off more