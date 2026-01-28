# Farmer Market Pool - Agricultural Marketplace Platform

A unified digital marketplace connecting farmers with buyers in Kenya and East Africa.

## 🌾 Overview

This platform solves real problems in the agricultural value chain:
- Middlemen exploitation
- Price uncertainty  
- Post-harvest losses
- Lack of market access for small-scale farmers
- Payment delays

## 🏗️ Architecture

### Backend (Django)
- Django + Django REST Framework
- PostgreSQL database
- GeoDjango for location-based matching
- Celery + Redis for background jobs
- M-Pesa payment integration

### Frontend (React)
- React with Vite
- Tailwind CSS
- PWA support
- Admin dashboard

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python3 -m venv venv  # Use python3 on macOS/Linux
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📱 Core Features

### Phase 1 (MVP)
- ✅ Farmer registration and crop listing
- ✅ Buyer browse and ordering
- ✅ Pricing engine with market prices
- ✅ M-Pesa payments with escrow
- ✅ Logistics and collection points
- ✅ Order tracking

### Phase 2 (Future)
- AI demand forecasting
- Crop planning recommendations
- Input marketplace
- Micro-loans & insurance
- Export-grade certification

## 💰 Business Model
- Transaction commission (3-10%)
- Buyer subscriptions
- Featured listings
- Logistics fees
- Data & insights (B2B)

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete feature list and architecture

## 📄 License
Proprietary
