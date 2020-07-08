'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/DBProyectoTwitter2018064', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false})
    .then(()=>{
        console.log('Conexión a la base de datos correcta');
        app.listen(port, ()=>{
            console.log('El servidor esta corriendo por el puerto:', port);
        })
    })
    .catch(err=>{
        console.log('Error al intentar conectarse', err);
    })