# CS-URA Room and Resource Management System

A comprehensive web application for managing university room bookings, events, and resources built with Nuxt 3.

## Features

- 🏢 **Room Management**: Create, edit, and manage university rooms with facilities and availability
- 📅 **Event Management**: Schedule and organize events with room and resource booking
- 📦 **Resource Management**: Track and manage university resources and equipment
- 👥 **User Management**: User authentication, profiles, and admin controls
- 📄 **Document Generation**: Automatic PDF generation for event documentation
- 🔒 **Authentication**: Secure JWT-based authentication system
- 📱 **Responsive Design**: Modern, mobile-friendly interface

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
git clone <repository-url>
cd csura
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure secret for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time (e.g., "7d")

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

## Project Structure

```
csura/
├── assets/          # CSS and static assets
├── composables/     # Vue composables for shared logic
├── layouts/         # Application layouts
├── middleware/      # Route middleware
├── pages/           # Application pages and routes
├── public/          # Static public files
├── server/          # Server-side API and utilities
│   ├── api/         # API endpoints
│   ├── models/      # Database models
│   └── utils/       # Server utilities
└── types/           # TypeScript type definitions
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `API_BASE_URL` | API base URL | No |

## License

This project is developed for CS-URA (Computer Science - Romanian-American University).

## Contributing

This is a university project. For questions or contributions, please contact the CS-URA team.