# Deployment Guide

## Quick Start (Local Development)

1. **Run the startup script**:
   ```bash
   # On Windows
   start.bat
   
   # On Mac/Linux
   chmod +x start.sh && ./start.sh
   ```

2. **Or manually**:
   ```bash
   npm run install-all
   npm run seed  # Create sample data
   npm run dev   # Start both servers
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Sample Login Credentials

After running the seed script:
- **Patient**: patient@example.com / password123
- **Doctor**: doctor@example.com / password123  
- **Admin**: admin@example.com / password123

## Free Deployment Options

### 1. Render (Recommended)

**Backend Deployment:**
1. Create account at render.com
2. Connect your GitHub repository
3. Create a new Web Service
4. Settings:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment Variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your_secure_jwt_secret_here
     ```

**Frontend Deployment:**
1. Create a new Static Site
2. Settings:
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
   - Environment Variables:
     ```
     REACT_APP_API_URL=https://your-backend-url.onrender.com/api
     ```

### 2. Railway

1. Create account at railway.app
2. Connect GitHub repository
3. Deploy automatically on push
4. Set environment variables in dashboard

### 3. Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
1. Connect GitHub to vercel.com
2. Deploy client folder
3. Set environment variable: `REACT_APP_API_URL`

**Backend on Railway:**
1. Deploy server folder to railway.app
2. Set environment variables

### 4. Netlify (Frontend) + Heroku (Backend)

**Frontend on Netlify:**
1. Connect GitHub to netlify.com
2. Build settings:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/build`

**Backend on Heroku:**
1. Create Heroku app
2. Connect GitHub repository
3. Set buildpacks and environment variables

## Environment Variables

### Server (.env in server folder)
```env
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_change_this
NODE_ENV=production
```

### Client (.env in client folder)
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

## Database Migration

For production, consider migrating from Excel to:
- **PostgreSQL** (recommended for Render/Railway)
- **MongoDB** (for document-based storage)
- **SQLite** (for simple deployments)

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Set up file upload limits
- [ ] Enable security headers

## Monitoring & Maintenance

- Set up error logging (e.g., Sentry)
- Monitor application performance
- Regular database backups
- Update dependencies regularly
- Monitor file storage usage

## Scaling Considerations

- Use cloud storage for file uploads (AWS S3, Cloudinary)
- Implement caching (Redis)
- Add load balancing
- Use CDN for static assets
- Implement database connection pooling

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Update CORS settings in server
2. **File Upload Issues**: Check file size limits and permissions
3. **Database Connection**: Verify Excel file permissions
4. **Build Failures**: Check Node.js version compatibility

### Debug Mode:
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test API endpoints manually
4. Check network connectivity
5. Review platform-specific documentation