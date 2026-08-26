# Starter Backend

A comprehensive Node.js/Express backend application with TypeScript, authentication, database management, and background job processing.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (RBAC)
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Background Jobs**: Redis-powered job queue with BullMQ
- **Email Service**: Nodemailer integration with queue support
- **Monitoring**: Winston logging with OpenTelemetry tracing
- **Security**: Helmet, CORS, rate limiting, input validation
- **File Uploads**: Multer integration for handling file uploads
- **Image Processing**: Sharp for image manipulation
- **Development Tools**: TypeScript, ESLint, Prettier, Husky

## 📦 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: JWT with Arctic (OAuth)
- **Logging**: Winston with Loki integration
- **Monitoring**: OpenTelemetry
- **Validation**: Zod
- **File Processing**: Sharp, Multer
- **Development**: Nodemon, ESLint, Prettier, Husky

## 🛠️ Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd starter-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Seed the database:
```bash
npm run seed
```

6. Start the development server:
```bash
npm run dev
```

## 📂 Project Structure

```
src/
├── app/                    # Application core
│   ├── app.ts             # Express app configuration
│   └── workerManager.ts   # Background worker management
├── config/                # Configuration files
├── constants/             # Application constants
├── db/                    # Database related files
│   └── schema/           # Database schema and migrations
├── lib/                   # Utility libraries
├── middleware/            # Express middleware
├── modules/              # Feature modules
│   ├── auth/             # Authentication module
│   └── user-management/  # User management module
├── queues/               # Background job queues
├── scripts/              # Utility scripts
├── services/             # Business logic services
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── workers/              # Background workers
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run seed` - Seed the database with initial data
- `npm run lint` - Run ESLint
- `npm run prettier` - Format code with Prettier

## 🔐 Authentication

The application uses JWT-based authentication with support for:

- User registration and login
- Role-based access control (RBAC)
- OAuth integration (Google, GitHub)
- Refresh token rotation
- Permission-based authorization

## 📊 Database Schema

Key entities:
- **Users**: User accounts with profile information
- **Roles**: User roles (admin, user, etc.)
- **Permissions**: Granular permissions
- **Refresh Tokens**: JWT refresh token management

## 🚀 Background Jobs

The application includes a robust background job system:

- **Email Queue**: Handle email sending asynchronously
- **Worker Management**: Automatic worker lifecycle management
- **Job Monitoring**: Built-in job status tracking
- **Error Handling**: Automatic retry and error logging

## 📧 Email System

Email functionality includes:
- SMTP configuration
- Template-based emails
- Queue-based sending
- Authentication emails (welcome, password reset, etc.)

## 🔍 Monitoring & Logging

- **Winston**: Structured logging with multiple transports
- **OpenTelemetry**: Distributed tracing
- **Loki Integration**: Log aggregation (optional)
- **Metrics**: Prometheus-compatible metrics

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Zod-based request validation
- **JWT Security**: Secure token handling
- **Password Hashing**: bcrypt password hashing

## 🔧 Environment Variables

See `.env.example` for all available environment variables including:

- Database connection
- Redis configuration
- JWT secrets
- SMTP settings
- OAuth credentials
- Monitoring endpoints

## 📝 API Documentation

The API follows RESTful conventions with the following main endpoints:

- `/api/auth/*` - Authentication endpoints
- `/api/user-management/*` - User management endpoints

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.