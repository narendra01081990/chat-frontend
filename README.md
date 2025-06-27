# React Chat Application

A real-time chat application built with React, TypeScript, Socket.io, and Express.

## Features

- Real-time messaging with Socket.io
- User join/leave notifications
- File and image uploads
- Emoji picker
- Reply functionality
- Sound notifications
- Dark/light theme
- Mobile responsive design
- Image preview modal
- Typing indicators

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   node chat.js
   ```

The backend will run on `http://localhost:5000` and `http://192.168.1.3:5000` for mobile testing.

### Frontend Setup

1. Navigate to the project directory:
   ```bash
   cd project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`.

## Mobile Testing

To test the application on mobile devices:

1. Make sure both frontend and backend are running
2. Find your computer's local IP address (e.g., 192.168.1.3)
3. Update the configuration in `src/config.ts` if needed
4. Access the app from your mobile device using the local IP

## Configuration

The application uses a configuration file (`src/config.ts`) to manage backend URLs and settings. You can customize:

- Backend URL for API calls
- Socket URL for real-time connections
- File upload limits
- Allowed file types

## Troubleshooting

### Images not visible to other users

1. Check that the backend is running and accessible
2. Verify the uploads directory exists in the backend
3. Check browser console for CORS errors
4. Ensure the backend URL is correct in the configuration

### Mobile upload failures

1. Check network connectivity
2. Verify the backend is accessible from mobile device
3. Check browser console for detailed error messages
4. Ensure CORS is properly configured

### File upload errors

1. Check file size (max 10MB)
2. Verify file type is supported
3. Check backend logs for errors
4. Ensure uploads directory has write permissions

## File Structure

```
project/
├── src/
│   ├── components/          # React components
│   ├── context/            # React context providers
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── config.ts           # Configuration file
├── backend/
│   ├── chat.js             # Express server with Socket.io
│   └── uploads/            # Uploaded files directory
└── README.md
```

## Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io, Multer
- **Real-time**: Socket.io
- **File Upload**: Multer
- **UI Components**: Lucide React icons
- **Styling**: Tailwind CSS
- **State Management**: React Context API

## License

MIT License 