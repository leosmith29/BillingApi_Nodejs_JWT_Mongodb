const mongoose = require('mongoose');
const uid = require('uuid-token-generator');
const tools = require('../tools/all.custom.tools.js')

const tk = new uid()
const BillSchema = mongoose.Schema({
bill_uid: {type: String, default: tk.generate()},
charge: {type:Number,default:0.0},
rate:{type:Number,default:1},
vat:{type:Number,default:1},
prev_arrears:{type:Number,default:0.0},
reversed:{type:Boolean,default:false},
reversed_comment:String,
reversed_by:String,
customer_id: String,
createdby:String,
billamount:{type: Number, default: 0.0},
vatamount:{type: Number, default: 0.0},
billtype: String,//Selection values can be set in ../config/all.config.js
status: {type:Boolean, default:true},
sms:{type:Boolean,default:false}
}, {
    timestamps: true
});

module.exports = mongoose.model('Billing', BillSchema);