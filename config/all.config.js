//All Database Configurations
const database_url = 'mongodb://localhost:27017/simplebill';
//Application Configuration
const app_name = 'simplebill'
const host = "Your Host"
const port = 3000
//JWT Configurations
const appjwtsecret = "12345678";
const apijwtsecret = "23456789";
//Billing types
billtype = ['water','electricity']
//transaction for?
pay_for = billtype
//Model settings
cant_edit = ['billing,electricty']//this are model name that can't be edit  through the api cause their records affects a large part of the system
cant_delete = ['billing,electricty'] //this are model name that can't be deleted from through the api cause their records after a large part of the system
module.exports = {
    database_url,
    appjwtsecret,
    apijwtsecret,
    app_name,
    host,
    port,
    billtype,
    pay_for,
    cant_delete,
    cant_edit
}