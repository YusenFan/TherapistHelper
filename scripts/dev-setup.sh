#!/bin/bash

# TherapistHelper Development Setup Script
echo "🏥 TherapistHelper Development Setup"
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up --build -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec postgres pg_isready -U therapist -d therapist_helper; do
    echo "⏳ Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready"

# Start backend
echo "🚀 Starting backend..."
docker-compose up --build -d backend

echo "⏳ Waiting for backend to be ready..."
sleep 5

# Start frontend
echo "🎨 Starting frontend..."
docker-compose up --build -d frontend

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📍 Services:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Database: localhost:5432"
echo ""
echo "🔧 Useful commands:"
echo "   docker-compose logs -f backend    # View backend logs"
echo "   docker-compose logs -f frontend   # View frontend logs"
echo "   docker-compose down               # Stop all services"
echo ""
echo "🔍 To view all logs: docker-compose logs -f" 