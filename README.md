# Memeingle Express Server

## Description
This is the server-side application for the Memeingle platform, built with Express.js. The server connects to a MongoDB database, handles authentication, user management, and meme-related routes, and includes CORS support for cross-origin requests.

## Environment Variables
The application uses environment variables for configuration. Create a `.env` file in the root of your project with the following content:

```dotenv
MONGO_URL=your_mongodb_connection_string
PORT=5000
```

Replace `your_mongodb_connection_string` with your actual MongoDB connection string.

## Project Structure
```
.
├── routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── memeRoutes.js
├── .env
├── package.json
└── server.js
```

## Setup and Running the Server

### Prerequisites
- Node.js installed
- MongoDB running and accessible

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/memeingle-server.git
   cd memeingle-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the required environment variables (see above).

### Running the Server

Start the server using:
```bash
node server.js
```
The server will be running at `http://localhost:5000`.

## Routes

### Authentication Routes
- **POST /api/register**
  - Description: Register a new user.
  - Request Body: JSON containing user details (e.g., email, password).

- **POST /api/login**
  - Description: Log in a user.
  - Request Body: JSON containing login credentials (e.g., email, password).

### User Routes
- **GET /api/users**
  - Description: Get a list of all users.
  - Response: JSON array of user objects.

- **GET /api/users/:id**
  - Description: Get details of a specific user by ID.
  - Response: JSON object of the user.

### Meme Routes
- **GET /api/memes**
  - Description: Get a list of all memes.
  - Response: JSON array of meme objects.

- **GET /api/memes/:id**
  - Description: Get details of a specific meme by ID.
  - Response: JSON object of the meme.

## Middleware
- **CORS**:
  - Enabled for all routes to allow cross-origin requests.

- **JSON Body Parsing**:
  - Express middleware to parse JSON bodies.

## MongoDB Connection
The server connects to MongoDB using Mongoose. The connection string is provided via the `MONGO_URL` environment variable. The connection is established when the server starts, and a success or error message is logged accordingly.

## Example Usage
After starting the server, you can interact with the API using tools like Postman or cURL. For example, to get a list of memes:

```bash
curl http://localhost:5000/api/memes
```

## License
This project is licensed under the MIT License.

## Additional Notes
- Ensure MongoDB is running and accessible via the provided connection string in the `.env` file.
- The server uses modular route handlers for authentication, user, and meme management. Adjust the route handlers in the `routes` directory as needed for your application logic.
