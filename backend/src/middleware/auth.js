const jwt  = require('jsonwebtoken');
module.export = function authMiddleware(req,res,next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({message: 'No token provided'});

    }
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        request.user = decode;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });   
    }

}