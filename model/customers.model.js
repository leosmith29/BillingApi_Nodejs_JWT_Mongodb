const mongoose = require('mongoose');
const uid = require('uuid-token-generator');

const tk = new uid()
const CustomerSchema = mongoose.Schema({
    name: String,
    address: String,
    state: String,
    city: String,
    country: String,
    phone:String,
    email:String,
    company: String,
    status: {type:Boolean,default:true},
    build_no: String,
    account: {type: Number, unique:true},
    credit: {type: Number, default: 0.0},
    water_arrears: {type: Number, default: 0.0},
    elect_arrears: {type: Number, default: 0.0},
    createdby: String,
    customer_uid: {type: String, default: tk.generate()}
}, {
    timestamps: true
});

module.exports = mongoose.model('Customers', CustomerSchema);