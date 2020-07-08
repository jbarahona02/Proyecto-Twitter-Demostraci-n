'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = 'clave_super_secreta';

exports.ensureAuth = (req,res,next)=>{
    var param = req.body;  
    
    if(param.command){
        var params = param.command.split(' ');

        if((params[0].toUpperCase() == 'LOGIN') || (params[0].toUpperCase() == 'REGISTER')){
            next();
        } else if((params[0].toUpperCase() == 'ADD_TWEET') || (params[0].toUpperCase() == 'DELETE_TWEET') || (params[0].toUpperCase() == 'EDIT_TWEET') || (params[0].toUpperCase() == 'VIEW_TWEETS') 
                || (params[0].toUpperCase() == 'FOLLOW') || (params[0].toUpperCase() == 'UNFOLLOW') || (params[0].toUpperCase() == 'PROFILE')) {
            if(!req.headers.authorization){
                return res.status(403).send({ message : 'Petición sin autenticación'});
            } else {
                var token = req.headers.authorization.replace(/['"]+/g, '');
                try{
                    var payload = jwt.decode(token,key);
                    if(payload.exp <= moment().unix()){
                        return res.status(401).send({ message : 'Token expirado'});
                    }
                } catch(ex){
                    return res.status(404).send({message: 'Token no válido'});
                }

                req.user = payload;
                next();
            }
        } else {
            return res.send({ message: 'Ingrese un comando válido para realizar una acción'});
        }
    } else {
        return res.send({ message: 'Ingrese un comando para realizar una acción'});
    }
}