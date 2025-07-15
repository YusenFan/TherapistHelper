# TherapistHelper Setup Guide

## 🚀 Quick Start with Docker

The easiest way to run TherapistHelper is using our automated setup script:

```bash
# Make the script executable (if not already)
chmod +x scripts/dev-setup.sh

# Run the setup script
./scripts/dev-setup.sh
```

This script will:
- Start PostgreSQL database
- Build and run the FastAPI backend
- Build and run the Next.js frontend
- Set up all necessary dependencies

## 📍 Access Points

Once running, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (username: `therapist`, password: `therapist123`)

## 🛠️ Manual Setup

If you prefer to run components individually:

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Database Setup
```bash
# Start only PostgreSQL
docker-compose up -d postgres

# Wait for database to be ready
docker-compose logs -f postgres
```

### Backend Setup
```bash
# Option 1: Using Docker
docker-compose up --build -d backend

# Option 2: Local development
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
# Option 1: Using Docker
docker-compose up --build -d frontend

# Option 2: Local development
cd frontend
npm install
npm run dev
```

## 🔧 Useful Commands

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Rebuild and restart everything
docker-compose down && docker-compose up --build

# Access database directly
docker-compose exec postgres psql -U therapist -d therapist_helper
```

## 🔐 Security Features

- **Data Encryption**: Client names and background information are encrypted at rest
- **Secure Database**: PostgreSQL with proper user permissions
- **CORS Protection**: Configured for development and production
- **Input Validation**: Comprehensive data validation on both frontend and backend

## 🏗️ Architecture

```
Frontend (Next.js) → Backend (FastAPI) → Database (PostgreSQL)
     ↓                    ↓                      ↓
Port 3000            Port 8000              Port 5432
```

## 📊 Database Schema

The application creates the following tables:
- `clients` - Encrypted client information with UUID support

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Reset database
docker-compose down
docker volume rm therapisthelper_postgres_data
docker-compose up -d postgres
```

### Backend Issues
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Frontend Issues
```bash
# Check frontend logs
docker-compose logs frontend

# Clear node modules and rebuild
docker-compose down
docker volume rm therapisthelper_frontend_node_modules
docker-compose up --build frontend
```

## 🌟 Features Implemented

✅ **Client Management**
- Create new client profiles
- View client list
- Encrypted storage of sensitive data
- Real-time form validation

✅ **Database Integration**
- PostgreSQL with encryption
- Automatic table creation
- Data persistence

✅ **API Integration**
- RESTful API endpoints
- Automatic API documentation
- Error handling and validation

✅ **Security**
- Field-level encryption for sensitive data
- Secure database credentials
- CORS protection

## 🔄 Next Steps

The following features are planned for future implementation:
- User authentication and authorization
- Session management and notes
- Audio transcription
- AI-powered insights
- Advanced client analytics

## 💡 Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **API Documentation**: Visit http://localhost:8000/docs for interactive API documentation
3. **Database Access**: Use any PostgreSQL client to connect to localhost:5432
4. **Logs**: Always check logs if something isn't working as expected

## 🆘 Support

If you encounter any issues:
1. Check the logs using `docker-compose logs`
2. Ensure Docker is running and has sufficient resources
3. Verify ports 3000, 8000, and 5432 are available
4. Try restarting with `docker-compose down && docker-compose up --build` 