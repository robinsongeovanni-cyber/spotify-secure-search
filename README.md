# Spotify Secure Search

A secure web application for searching and playing Spotify tracks with user account management.

## Features

- ✅ User registration and login (backend database)
- ✅ Secure password hashing with bcrypt
- ✅ JWT authentication
- ✅ Search Spotify tracks
- ✅ Play music using Spotify Web Playback SDK
- ✅ User profile management

## Setup

### Prerequisites
- Node.js 14+
- npm or yarn
- Spotify Developer Account

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
JWT_SECRET=your-super-secret-key-here
PORT=5000
NODE_ENV=development
```

### 3. Get Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Copy your **Client ID**
4. Add a Redirect URI (e.g., `http://localhost:5000/`)

### 4. Update Frontend Config

Open `public/index.html` and update:

```javascript
const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
const REDIRECT_URI = 'http://localhost:5000/'; // or your domain
const API_BASE = 'http://localhost:5000'; // Backend URL
```

### 5. Start the Backend

```bash
npm start
```

The backend runs on `http://localhost:5000`

## Database

Users are stored in SQLite (`spotify_users.db`). Schema:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
)
```

## API Endpoints

### Authentication

- **POST** `/auth/signup` - Register new user
  - Body: `{ email, password, display_name }`
  - Returns: `{ token, user }`

- **POST** `/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- **GET** `/auth/profile` - Get user profile (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user }`

- **POST** `/auth/logout` - Logout (optional)

## Security Features

✅ Passwords hashed with bcrypt (10 salt rounds)
✅ JWT tokens with 7-day expiration
✅ CORS enabled for cross-origin requests
✅ Input validation on all endpoints
✅ SQLite database (no cloud credentials exposed)

## Development

### Run with auto-reload:

```bash
npm run dev
```

## Production Deployment

1. **Set strong JWT_SECRET** in `.env`
2. **Enable HTTPS** (required for Spotify OAuth)
3. **Update REDIRECT_URI** to your domain
4. **Use a production database** (PostgreSQL recommended)
5. **Set NODE_ENV=production**
6. **Deploy** to Heroku, Vercel, or your server

### Heroku Example:

```bash
heroku create your-app-name
heroku config:set JWT_SECRET="your-secret" SPOTIFY_CLIENT_ID="your-id"
git push heroku main
```

## Troubleshooting

### "Account created but I can't sign in"
- Check that your backend is running (`npm start`)
- Verify `API_BASE` in `public/index.html` matches your backend URL

### "Playback not working"
- Ensure you have a Spotify Premium account
- Check that your Spotify credentials are correct
- Make sure REDIRECT_URI matches both your code and Spotify Dashboard

### Database locked error
- Delete `spotify_users.db` and restart the server
- Or check if another instance is running

## License

MIT
