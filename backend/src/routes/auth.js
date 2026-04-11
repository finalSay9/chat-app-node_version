
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { error } = require('console');


const router = express.Router();

//helper function to generate jwt

function generateToken(user) {
    return jwt.sign({id: user.id,
        username: user.username,
        email: user.email
    },
    process.env.JWT_SECRET,
{expiresIn: process.env.JWT_EXPIRES_IN}
);

}

//ENDPOINTS

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body

    if( !username || !email || !password ){
        return res.status(400).json({error: "all filled required"})
    }

    if(password.length < 6) {
        return res.status(400).json({error: 'password must be at least 6 characters'})
    }
    try {
        const passwordHash = await bcrypt.hash(password, 12)
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
             [username, email, passwordHash]
        );

        const user = result.rows[0]
        const token = generateToken(user);

        res.status(201).json({user, token})


    } catch (err) {
        if(err.code ==='23505') {
            return res.status(409).json({error: 'username or email already taken'})
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
        
    }
})

//post login

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if(!email || !password) {
        return res.status(400).json({error: 'email and password are required'})
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]

        );

        const user = result.rows[0];

        if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            }
        })


    } catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Server error' });
        
    }
})

module.exports = router; // ✅ export the router directly