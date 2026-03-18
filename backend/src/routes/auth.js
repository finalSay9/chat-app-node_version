
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');


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