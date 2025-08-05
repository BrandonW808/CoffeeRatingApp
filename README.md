# Coffee Tracker - User-Specific MongoDB Version

A full-stack web application for tracking and rating coffee beans with user authentication and MongoDB storage.

## Features

- **User Authentication**: Secure registration and login system with JWT tokens
- **Personal Coffee Library**: Each user has their own private collection of coffee ratings
- **Detailed Coffee Tracking**: Record roaster, origin, roast date, brew method, rating, and tasting notes
- **Statistics Dashboard**: View insights about your coffee preferences and spending
- **Data Export**: Export your coffee data as JSON
- **Responsive Design**: Works great on desktop and mobile devices

## Technology Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with HTTP-only cookies
- **Build Tools**: Webpack, Babel

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coffee-rating-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/coffee-rating-app

# JWT Secret for authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Server port
PORT=3001

# Node environment
NODE_ENV=development
```

4. Start MongoDB:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongodb

# On Windows
# MongoDB should start automatically if installed as a service
```

## Running the Application

### Development Mode

Start the backend server:
```bash
npm run dev
```

In a separate terminal, start the webpack dev server:
```bash
npm run client:dev
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001/api

### Production Build

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
NODE_ENV=production npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/status` - Check authentication status

### Coffee Management
- `GET /api/coffees` - Get all coffees for logged-in user
- `GET /api/coffees/:id` - Get specific coffee
- `POST /api/coffees` - Create new coffee rating
- `PUT /api/coffees/:id` - Update coffee rating
- `DELETE /api/coffees/:id` - Delete coffee rating
- `GET /api/coffees/export/json` - Export user's coffee data
- `GET /api/coffees/stats/summary` - Get coffee statistics

## Database Schema

### User Model
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  createdAt: Date
}
```

### Coffee Model
```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  roaster: String,
  origin: String,
  roastDate: Date,
  brewMethod: String (enum),
  rating: Number (1-5),
  notes: String,
  price: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens stored in HTTP-only cookies
- Input validation on all API endpoints
- User data isolation - users can only access their own data
- CORS configured for production

## Deployment

### Deploying to Heroku

1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Add MongoDB Atlas addon or configure external MongoDB:
```bash
heroku addons:create mongolab:sandbox
```

3. Set environment variables:
```bash
heroku config:set JWT_SECRET=your_production_secret
heroku config:set NODE_ENV=production
```

4. Deploy:
```bash
git push heroku main
```

### Environment Variables for Production

- `MONGODB_URI`: MongoDB connection string (usually provided by hosting service)
- `JWT_SECRET`: Strong secret key for JWT signing
- `NODE_ENV`: Set to "production"
- `PORT`: Usually provided by hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
