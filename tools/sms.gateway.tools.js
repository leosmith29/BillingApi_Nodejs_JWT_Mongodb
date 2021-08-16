var phone_field = 'recipients'// The params to field hold the Phone number
var message_field = 'messagetext'// The params field to hold the Message
var params ={username:'0000',sender:''} //other params required by the sms gateway and thier values
var url = "http://api.ebulksms.com:8080/sendsms"//Gateway API URL
let success_text = "200"  // this should represent the string that the response from the sms gateway should contain for us to know the sms was sent

module.exports = {
    phone_field,
    message_field,
    params,
    url,
    success_text
}