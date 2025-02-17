import { verify } from 'jsonwebtoken';
import { query } from './database'; // Assuming you have a database module for querying

const attachUserRole = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        const user = await query('SELECT role FROM Users WHERE user_id = ?', [decoded.user_id]);
        if (!user.length) return res.status(401).json({ message: 'User not found' });

        req.user = { ...decoded, role: user[0].role };
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export async function isAdminOrModerator(context) {
    const userRole = context.user.role; // Assume `context.user` contains authenticated user data
    if (userRole !== 'admin' && userRole !== 'moderator') {
        throw new Error('Unauthorized');
    }
    return true;
}

export { attachUserRole };
