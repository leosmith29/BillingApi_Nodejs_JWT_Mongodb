const mongoose = require('mongoose');
const uid = require('uuid-token-generator');

const tk = new uid()

const UsersSchema = mongoose.Schema({
    name: {type:String, default:''},
    username: String,
    user_uid: {type: String, default: tk.generate()},
    password: String,
    password_encrypt: String,
    credit:{type:Number,default:0.0},
    accessRole:[Number],
    apptoken:{type:String, default:''},
    apitoken:{type:String, default:''},
    createdby:{type:String, default:''},
    status: {type:Boolean,default:true},
    created:{type:Date,default:Date.now}
}, {
    timestamps: true
});

module.exports = mongoose.model('Users', UsersSchema);