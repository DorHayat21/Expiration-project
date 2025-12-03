import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import startScheduler from './services/notificationService.js'; 

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT;

// Safety check for PORT
if (!PORT) {
  console.error("Error: PORT is not defined in .env file!");
  process.exit(1);
}

// --- Middleware Configuration ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// --- API Routes ---
app.get('/', (req, res) => {
  res.status(200).send('API is running successfully.');
});

app.use('/api/users', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/assets', assetRoutes);

// --- Server Initialization ---
app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
  startScheduler(); 
});