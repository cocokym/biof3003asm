# HeartLen App

The HeartLen App is a web-based tool designed to process photoplethysmography (PPG) signals captured via a webcam. It calculates heart rate, heart rate variability (HRV), and signal quality using machine learning models. The processed data can be saved to a MongoDB database for further analysis.

## 1. Project Overview

The HeartLen App leverages a webcam to capture PPG signals and process them in real-time. It provides the following features:

- **Heart Rate Calculation**: Measures beats per minute (BPM).
- **Heart Rate Variability (HRV)**: Analyzes the variability in heartbeats.
- **Signal Quality Assessment**: Evaluates the quality of the captured PPG signal.
- **Data Storage**: Saves processed data to a MongoDB database for further analysis.

## 2. Installation Instructions
### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or a local MongoDB instance)

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/cocokym/biof3003asm.git
   cd heartlen-app

2. **Install dependencies**:
   ```bash
   npm install 

3. **Set up environment variables**:
- Create a .env.local file in the root directory.
- Add your MongoDB connection string:
  ```bash
  MONGODB_URI=your_mongodb_connection_string
4. **Start the development server**:
   ```bash
   npm run dev

5. **Open the app in your browser**:
-  http://localhost:3000.

## Linking to Database
To link the app to your MongoDB database:
1. Create a MongoDB Atlas cluster or use a local MongoDB instance.
2. Copy the connection string from MongoDB Atlas and paste it into the `.env.local` file as shown above.
3. Ensure the database has a collection named `records` to store PPG data.

## Deployment
To deploy the app:
1. Build the production version:
   ```bash
   npm run build
2. Start the production server:
   ```bash
   npm run start
3. Deploy to a hosting platform:
- Use platforms like Vercel for seamless deployment.
- Ensure the .env.local file is configured with the correct MongoDB connection string in the hosting environment.
4. Vercel link: https://biof3003asmheartlensfinal.vercel.app/
