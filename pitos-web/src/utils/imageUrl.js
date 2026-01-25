import { API_URL } from '../config';

export const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150';
    if (imagePath.startsWith('http')) return imagePath;
    // Assuming backend returns relative paths like '/uploads/file.jpg' or just 'file.jpg'
    // If it's just 'file.jpg', we might need to prepend '/uploads/'? 
    // The backend `server.js` serves `/uploads` static route.
    // The previous code seemed to use full URLs.
    // Let's assume standard relative path behavior. 
    // If the path doesn't start with '/', add it?
    // Backend: app.use('/uploads', authenticateToken, express.static(uploadDir));
    // Wait, the static route is protected by `authenticateToken` in server.js?
    // app.use('/uploads', authenticateToken, express.static(uploadDir));
    // That will brake public images! Images should be public usually for menu.
    
    // Correction: We need to fix backend static route first if it is protected.
    // But addressing frontend first.
    
    return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};
