// lib/mongoose.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectToDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("Please define the MONGODB_URI environment variable inside .env");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME
    });

    console.log('Successfully connected to MongoDB');
    console.log(`Connected to database: ${process.env.MONGODB_DB_NAME}`);
    
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default mongoose;