'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetSchema = Schema({
    datePublication: String,
    content: String
})

module.exports = mongoose.model('tweet', tweetSchema);