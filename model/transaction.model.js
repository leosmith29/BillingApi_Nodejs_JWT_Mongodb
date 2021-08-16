const mongoose = require('mongoose');
const uid = require('uuid-token-generator');

const tk = new uid()
const TransSchema = mongoose.Schema({
trans_uid: {type: String, default: tk.generate()},
amount: {type:Number,default:0.0},
prev_arrears:{type:Number,default:0.0},
pay_for:String,//Selection values can be set in ../config/all.config.js
status: {type:Boolean,default:true},
createdby: String,
reversed:{type:Boolean,default:false},
reversed_comment:String,
reversed_by:String,
customer_id:String,
sms:{type:Boolean,default:false}
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', TransSchema);