'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
    name: String,
    email: String,
    username: String,
    password: String,
    dateCreationAccount: String,
    following: [{ type: Schema.Types.ObjectId, ref:'user'}],
    followers: [{ type: Schema.Types.ObjectId, ref:'user'}],
    tweets: [{ 
        datePublication: String,
        content: String
    }]
})

module.exports = mongoose.model('user', userSchema);