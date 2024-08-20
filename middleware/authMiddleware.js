const { response, request } = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req = request, res =response, next) => {
      const token = req.header('x-token');
      if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
      }
      try {
        const { uid } = jwt.verify( token, process.env.JWT_SECRET);
        const usuario = await User.findById( uid );
        if ( !usuario ) {
            return res.status(401).json({
                msg: 'Token no valido - usuario no existe en DB fisicamente'
            })
        }
        req.usuario = usuario; 
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({
            msg: 'Token no válido'
        })
    }

};

module.exports = { protect };

