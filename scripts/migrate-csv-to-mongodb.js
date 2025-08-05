#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/server/models/User');
const Coffee = require('../src/server/models/Coffee');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Parse CSV file
const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    Papa.parse(fileContent, {
      header: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
};

// Main migration function
const migrate = async () => {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node migrate-csv-to-mongodb.js <csv-file> <username> <email> [password]');
    console.log('Example: node migrate-csv-to-mongodb.js coffee-ratings.csv john john@example.com mypassword');
    process.exit(1);
  }

  const [csvFile, username, email, password = 'changeme123'] = args;

  if (!fs.existsSync(csvFile)) {
    console.error(`CSV file not found: ${csvFile}`);
    process.exit(1);
  }

  try {
    // Connect to database
    await connectDB();

    // Check if user exists
    let user = await User.findOne({ $or: [{ username }, { email }] });
    
    if (!user) {
      // Create new user
      console.log(`Creating new user: ${username}`);
      user = new User({
        username,
        email,
        password
      });
      await user.save();
      console.log('User created successfully');
    } else {
      console.log(`Using existing user: ${username}`);
    }

    // Parse CSV data
    console.log(`Parsing CSV file: ${csvFile}`);
    const csvData = await parseCSVFile(csvFile);
    console.log(`Found ${csvData.length} coffee entries`);

    // Migrate coffee data
    let successCount = 0;
    let errorCount = 0;

    for (const row of csvData) {
      try {
        // Map CSV fields to Coffee model
        // Adjust these mappings based on your CSV structure
        const coffeeData = {
          userId: user._id,
          name: row.name || row.coffee_name || 'Unknown Coffee',
          roaster: row.roaster || 'Unknown Roaster',
          origin: row.origin || row.country || 'Unknown Origin',
          roastDate: row.roast_date ? new Date(row.roast_date) : new Date(),
          brewMethod: mapBrewMethod(row.brew_method || row.brewing_method || 'Other'),
          rating: parseInt(row.rating) || 3,
          notes: row.notes || row.tasting_notes || '',
          price: parseFloat(row.price) || undefined
        };

        // Create coffee entry
        const coffee = new Coffee(coffeeData);
        await coffee.save();
        successCount++;
        
        console.log(`✓ Migrated: ${coffeeData.name} by ${coffeeData.roaster}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to migrate row:`, error.message);
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Total entries: ${csvData.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('\nMigration complete!');
    
    if (password === 'changeme123') {
      console.log('\n⚠️  WARNING: Default password used. Please login and change your password!');
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Helper function to map brew methods
const mapBrewMethod = (method) => {
  const methodLower = method.toLowerCase();
  
  if (methodLower.includes('espresso')) return 'Espresso';
  if (methodLower.includes('pour') || methodLower.includes('v60') || methodLower.includes('chemex')) return 'Pour Over';
  if (methodLower.includes('french') || methodLower.includes('press')) return 'French Press';
  if (methodLower.includes('aero')) return 'Aeropress';
  if (methodLower.includes('cold')) return 'Cold Brew';
  
  return 'Other';
};

// Run migration
migrate();
