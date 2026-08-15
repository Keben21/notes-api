# Notes API

A RESTful API built with Node.js and Express for creating and managing personal notes. Users can sign up, log in, and perform CRUD operations on their own notes.

## Features

- User signup and login
- Password hashing with bcrypt
- JWT authentication
- Protected routes
- Create notes
- Get all notes
- Get a single note
- Update notes
- Delete notes
- Request validation
- Login rate limiting
- Users can only access their own notes

## Built With

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- express-validator
- express-rate-limit
- dotenv

## Getting Started

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the server:

```bash
node server.js
```

The API will run on:

```text
http://localhost:5000
```

You can use Postman or another API testing tool to test the endpoints.

## API Endpoints

### Authentication

| Method | Endpoint | Description |

| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Log in and receive a JWT |

### Notes

All note routes require a valid JWT.

| Method | Endpoint | Description |

| POST | `/api/notes` | Create a note |
| GET | `/api/notes` | Get all your notes |
| GET | `/api/notes/:id` | Get a specific note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |

For protected routes, include the token in the request header:

```text
Authorization: Bearer YOUR_TOKEN
```

## What I Practiced

- Building REST APIs with Express
- Working with MongoDB and Mongoose
- JWT authentication
- Password hashing
- Express middleware
- CRUD operations
- Request validation
- Rate limiting
- Working with environment variables
- Testing APIs with Postman

## Future Improvements

- Add global error handling
- Add automated tests
- Add pagination for notes
- Add more validation for note updates
- Add API documentation
- Deploy the API
- Build a frontend for the API
