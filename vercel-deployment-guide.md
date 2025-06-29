# Vercel Deployment Guide

## Environment Variables Setup

When deploying to Vercel, you need to set the following environment variables in your Vercel project settings:

### Required Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the following variables:

```
VITE_BACKEND_URL=https://chat-backend-lfwv.onrender.com
VITE_SOCKET_URL=https://chat-backend-lfwv.onrender.com
```

### Deployment Steps

1. **Push your updated code to GitHub**
2. **Connect your repository to Vercel** (if not already done)
3. **Set the environment variables** as shown above
4. **Deploy**

### Important Notes

- Make sure your Render backend is running and accessible
- The backend URL should be the full HTTPS URL from Render
- Socket.IO connections will automatically use the same URL
- File uploads will work with the Render backend

### Troubleshooting

If you encounter CORS issues:
1. Check that your Render backend is running
2. Verify the CORS configuration in the backend allows your Vercel domain
3. Make sure the environment variables are set correctly in Vercel

### Local Development

For local development, you can create a `.env.local` file with:
```
VITE_BACKEND_URL=http://192.168.1.3:5000
VITE_SOCKET_URL=http://192.168.1.3:5000
``` 