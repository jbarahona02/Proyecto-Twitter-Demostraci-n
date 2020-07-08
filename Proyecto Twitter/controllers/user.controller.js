'use strict'

var User = require('../models/user.model');
var Tweet = require('../models/tweet.model');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var moment = require('moment');
moment.locale('es');

function commands(req,res){
    let param = req.body;
    let userID;

    if(param.command){
        let params = param.command.split(' ');

        switch(params[0].toUpperCase()){
            case 'ADD_TWEET':
                let tweet = new Tweet();
                userID = req.user.sub;

                if((params[1] && params[1] != '')){
                    let comDeleted = params.shift();
                    let textTweet = params.join(' ');
                    let datePublication = moment().format('MMMM Do YYYY, h:mm:ss a');

                    tweet.datePublication = datePublication; 
                    tweet.content = textTweet;

                        User.findOneAndUpdate({_id:userID}, {$push: {tweets: tweet}}, {new:true}, (err, userUpdated)=>{
                            if(err){
                                res.status(500).send({ message : 'Error general en el servidor inténtelo de nuevo más tarde'});
                            } else if (userUpdated){
                                res.send({ message: 'Tweet agregado',
                                           user: userUpdated.username,
                                           tweet: tweet});
                            } else {
                                res.status(404).send({ message : 'No se a logrado agregar el tweet'});
                            }
                        });
                } else {
                    res.send({ message : 'Debe de ingresar algún texto, no puede agregar un tweet vacío'});
                }
            break;
    
            case 'DELETE_TWEET':
                if((params[1] && params[1] != '')){
                    let tweetID = params[1];
                    userID = req.user.sub;

                    User.findOne({ _id: userID , "tweets._id": tweetID}, (err, userFind)=>{
                        if(err){
                            res.status(500).send({ message : 'Error general en el servidor, el id ingresado es inválido'});
                        } else if (userFind){   
                            let tweetDeleted = userFind.tweets.find(tweet => tweet._id == tweetID);
                            
                            User.findOneAndUpdate({_id:userID}, {$pull:{tweets:{_id:tweetID}}}, {new:true}, (err,userUpdated)=>{
                                if(err){
                                    res.status(500).send({ message :  'Error general en el servidor inténtelo de nuevo más tarde'});
                                } else if(userUpdated){
                                    res.send({message: 'Tweet eliminado con éxito',
                                              tweet: tweetDeleted});
                                } else {
                                    res.status(404).send({ message : 'No se a encontrado el tweet que se desea eliminar'});
                                }
                            });

                        } else {
                            res.status(403).send({ message : 'Error, no tiene permisos para esta ruta'});
                        }
                    });
                } else {
                    res.send({ message : 'Debe de ingresar el id del tweet que desea eliminar'});
                }
            break;
    
            case 'EDIT_TWEET':
                if((params[1] && params[1] != '')){
                    if((params[2] && params[2] != '')){
                        let tweetID = params[1];
                        userID = req.user.sub;

                        User.findOne({_id:userID, "tweets._id": tweetID}, (err, userFind)=>{
                            if(err){
                                res.status(500).send({ message : 'Error general en el servidor, el id ingresado es inválido'});
                            } else if(userFind){
                                let comDeleted1 = params.shift();
                                let comDeleted2 = params.shift();
                                let textTweet = params.join(' ');
                                let datePublication2  = moment().format('MMMM Do YYYY, h:mm:ss a');
        
                                User.findOneAndUpdate({_id:userID, "tweets._id": tweetID},{"tweets.$.datePublication": datePublication2,"tweets.$.content": textTweet},{new:true},(err,userUpdated)=>{
                                    if(err){
                                        res.status(500).send({ message : 'Error general en el servidor inténtelo de nuevo más tarde'});
                                    } else if (userUpdated){
                                        let tweetUpdated = userUpdated.tweets.find(tweet => tweet._id == tweetID);
                                        res.send({ message : 'Tweet actualizado con éxito',
                                                   user: userUpdated.username,
                                                   tweet: tweetUpdated});
                                    } else {
                                        res.status(404).send({ message : 'Se ha producido un error el tweet no se ha logrado actualizar'});
                                    }
                                });
                            } else {
                                res.status(403).send({ message : 'Error, no tiene permisos para esta ruta'});
                            }
                        });
                    } else {
                        res.send({ message : 'Debe de ingresar el texto que desea actualizar, no puede actualizar un tweet vacío'});
                    }
                } else {
                    res.send({ message : 'Debe de ingresar el id del tweet que desea actualizar'});
                }
            break;

            case 'VIEW_TWEETS':
                if((params[1] && params[1] != '')){
                    User.findOne({username: params[1]}, (err,userFind)=>{
                        if(err){
                            res.status(500).send({ message : 'Error general en el servidor inténtelo de nuevo más tarde'});
                        } else if (userFind){

                            if(userFind.tweets.length > 0){
                                res.send({ message: 'Tweets del usuario ' + userFind.username,
                                           tweets : userFind.tweets});
                            } else {
                                res.send({ message : 'El usuario ingresado aún no ha publicado ningún tweet'});
                            }
                        } else {
                            res.status(404).send({ message : 'No se encontró el usuario ingresado'});
                        }
                    });
                } else {
                    res.send({ message : 'Debe de ingresar el nombre de usuario del cual desea ver los tweets'});
                }
            break;

            case 'FOLLOW':
                if((params[1] && params[1] != '')){
                    userID = req.user.sub;

                    User.findOne({username: params[1]}, (err,userFind)=>{
                        if(err){
                            res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                        } else if (userFind){
                            if(userFind._id != userID){
                                User.findOne({_id:userID, following:userFind._id}, (err, userFind2)=>{
                                    if(err){
                                        res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                                    } else if (userFind2){
                                        res.send({ message : 'Usted ya sigue al usuario ' + userFind.username});
                                    } else {
                                        User.findOneAndUpdate({username : params[1]}, {$push:{followers:userID}}, {new:true}, (err,userUpdated1)=>{
                                            if(err){
                                                res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                                            } else if (userUpdated1){
                                                User.findByIdAndUpdate(userID, {$push: { following:userUpdated1._id}},{new:true}, (err, userUpdated2)=>{
                                                    if(err){
                                                        res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                                                    } else if (userUpdated2){
                                                        res.send({ message : 'Su solicitud a sido exitosa, ahora sigue al usuario ' + userUpdated1.username});
                                                    } else {
                                                        res.status(404).send({ message : 'Se ha producido un error, no se a logrado agregar a su perfil que sigue al usuario indicado'});
                                                    }
                                                });
                                            } else {
                                                res.send({ message: 'Se a producido un error no se ha logrado seguir al usuario indicado'});
                                            }
                                        });
                                    }
                                });
                            } else {
                                res.send({ message : 'El nombre de usuario ingresado es usted, no es posible seguirse así mismo'});
                            }
                        } else {
                            res.status(404).send({ message : 'No se ha encontrado el usuario ingresado'});
                        }
                    });
                } else {
                    res.send({ message : 'Debe de ingresar el nombre de usuario al cual desea seguir'});
                }
            break;

            case 'UNFOLLOW':
                if((params[1] && params[1] != '')){
                    userID = req.user.sub;

                    User.findOne({ username : params[1]}, (err, userFind)=>{
                        if(err){
                            res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                        } else if (userFind){
                            if(userID != userFind._id){
                            
                                User.findOne({_id: userID, following: userFind._id}, (err, userFind2)=>{
                                    if(err){
                                        res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                                    } else if (userFind2){
                                        User.findOneAndUpdate({username : params[1]}, {$pull:{followers:userID}}, {new:true}, (err,userUpdated1)=>{
                                            if(err){
                                                res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                                            } else if (userUpdated1){
                                                User.findByIdAndUpdate(userID, {$pull: { following:userUpdated1._id}},{new:true}, (err, userUpdated2)=>{
                                                    if(err){
                                                        res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                                                    } else if (userUpdated2){
                                                        res.send({ message : 'Su solicitud a sido exitosa, a dejado de seguir al usuario ' + userUpdated1.username});
                                                    } else {
                                                        res.status(404).send({ message : 'Se ha producido un error, no se a logrado eliminar de su perfil que sigue al usuario indicado'});
                                                    }
                                                });
                                            } else {
                                                res.send({ message: 'Se a producido un error no se ha logrado dejar de seguir al usuario indicado'});
                                            }
                                        });
                                    } else {
                                        res.send({ message : 'Usted no puede dejar de seguir al usuario ' + userFind.username + ', porque usted no lo sigue'});
                                    }
                                });
                            } else {
                                res.send({ message : 'El nombre de usuario ingresado es usted, no es posible dejar de seguirse así mismo'});
                            }
                        } else {
                            res.status(404).send({ message : 'No se ha encontrado el usuario ingresado'});
                        }
                    });
                } else {
                    res.send({ message : 'Debe de ingresar el nombre de usuario al cual desea seguir'});
                }
            break;

            case 'PROFILE':
                if((params[1] && params[1] != '')){
                    userID = req.user.sub;

                    User.findOne({username: params[1]}, (err, userFind)=>{
                        if(err){
                            res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                        } else if (userFind){
                            res.send({ message: 'Perfil de usuario',
                                    name : userFind.name,
                                    username : userFind.username,
                                    email : userFind.email,
                                    dateCreationAccount: userFind.dateCreationAccount,
                                    following : userFind.following,
                                    followers : userFind.followers,
                                    tweets : userFind.tweets});
                        } else {
                            res.status(404).send({ message : 'No se ha encontrado el usuario con el nombre de usuario indicado'});
                        }
                    }).populate({path:'following' , select: 'username'}).populate({path:'followers', select: 'username'});
                } else {
                    res.send({ message : 'Debe de ingresar el nombre de usuario perteneciente al usuario que desea ver'});
                }
            break;

            case 'LOGIN':
                if((params[1] && params[1] != '')){
                    if((params[2] && params[2] != '')){
                        User.findOne({$or:[{ username: params[1]}, {email: params[1]}]}, (err, userFind)=>{
                            if(err){
                                res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                            } else if (userFind){
                                bcrypt.compare(params[2], userFind.password, (err, passwordOk)=>{
                                    if(err){
                                        res.status(500).send({message: 'Se a producido un error al comparar las contraseñas'});
                                    } else if (passwordOk){
                                        res.send({message: 'Bienvenido', user : userFind.name,
                                                            'token' : jwt.createTokenUser(userFind)});
                                    } else {
                                        res.status(404).send({message: 'La contraseña ingresada es incorrecta'});
                                    }
                                });
                            } else {
                                res.send({ message : 'El nombre de usuario o correo ingresado es incorrecto'});
                            }
                        });
                    } else {
                        res.send({message: 'Debe de ingresar su contraseña'}); 
                    }
                } else {
                    res.send({ message : 'Debe de ingresar su nombre de usuario o correo'});
                }
            break;

            case 'REGISTER':
                let user = new User();

                if((params[1] && params[1] != '') && (params[2] && params[2] != '') && (params[3] && params[3] != '') && (params[4] && params[4] != '')){
                    User.findOne({$or:[{ username: params[3]}, {email : params[2]}]}, (err,userFind)=>{
                        if(err){
                            res.status(500).send({ message : 'Error general en el servidor inténtelo más tarde'});
                        } else if (userFind){
                            res.send({ message : 'El nombre de usuario o correo ingresado ya existe en el sistema'});
                        } else {
                            user.name = params[1];
                            user.email = params[2];
                            user.username = params[3];
                            user.dateCreationAccount = moment().format('MMMM Do YYYY');
                            
                            bcrypt.hash(params[4], null, null, (err, password)=>{
                                if(err){
                                    res.status(500).send({message: 'Error al encriptar contraseña'});
                                } else if (password){
                                    user.password = password;

                                    user.save((err, userRegister)=>{
                                        if(err){
                                            res.status(500).send({message : 'Error general al intentar guardar usuario'});
                                        } else if (userRegister){
                                            res.send({ message: 'Usuario registrado con éxito', user: userRegister});
                                        } else {
                                            res.status(404).send({ message : 'Se ha producido un error usuario no guardado'});
                                        }
                                    });
                                } else {
                                    res.status(418).send({message: 'Error inesperado'});
                                }
                            });
                        }
                    });
                } else {
                    res.send({ message : 'Ingrese todo los datos necesarios para registrar un usuario, recuerde que cada uno debe ir separado por un espacio'});
                }
            break;

            default:
                res.send({ message: 'Debe de ingresar un comando válido para realizar alguna acción'});
            break;
        }
    } else {
        res.send({ message: 'Ingrese un comando para realizar una acción'});
    }
}

module.exports = {
    commands
}