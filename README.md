# CS-URA Room and Event Management System

A web application that helps manage rooms, resources, and events for the Students' Club at [Romanian-American University](https://www.rau.ro/?lang=en). Built with modern web technologies to solve real organizational problems.

## The Problem & Solution

**The Challenge:** During my time as Project Manager at the [Romanian-American University's Student Club](https://www.rau.ro/students-club/?lang=en), I identified a critical organizational problem: information about available rooms, resources, and event approvals was scattered across multiple platforms, people, and difficult to access. This fragmentation led to:
- Confusion about room availability and booking procedures
- Difficulty tracking available resources for events
- Lack of centralized event status monitoring
- Time-consuming coordination between students, faculty, and administration

**The Solution:** This web application centralizes all event-related information and processes into one intuitive platform, allowing users to:
- View all available rooms and resources in one place
- Create, manage, and track events with real-time status updates
- Handle administrative tasks (Add, Edit, Delete) efficiently
- Streamline the entire event planning workflow

## Features

- **Room Management**: Create, edit, and manage university rooms with facilities and availability
- **Event Management**: Schedule and organize events with room and resource booking
- **Resource Management**: Track and manage university resources and equipment
- **User Management**: User authentication, profiles, and admin controls
- **Document Generation**: Automatic PDF generation for event documentation
- **Authentication**: Secure JWT-based authentication system
- **Responsive Design**: Modern, mobile-friendly interface

## Tech Stack

- **Frontend**: Vue 3, Nuxt 3, Tailwind CSS
- **Backend**: Nuxt 3 Server API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcryptjs
- **PDF Generation**: Puppeteer
- **UI**: Tailwind CSS with responsive design

## Setup

1. Clone the repository:
```bash
git clone https://github.com/zamqq/event-management-app-csura.git
cd csura
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
touch .env
```

Edit `.env` and add your configuration:
```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Contributing

This is a university project. For questions or contributions, please contact me.
