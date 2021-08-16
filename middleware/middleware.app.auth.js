const jwt = require('jsonwebtoken')
const config = require("../config/all.config.js")
var tools = require('../tools/all.custom.tools.js')

module.exports = (req,res,next) =>{

 let auth = req.headers['authorization']

 //Authenticate the user creating data except u creating ur admin record
 if(req.originalUrl == '/app/create/users' && req.body.username == 'admin')
{
	console.log("admin can be created without authentication")
}
else{
	if(!auth)
		tools.app401error(res,"Authorization Failed")
		//Verify Bearer Token
		jwt.verify(auth.replace("Bearer ",""),config.appjwtsecret,(err,decoded)=>{
			if(err)
				{
					console.log('error ${err}')
					tools.app401error(res,"Authorization Failed")
				}
			if(!decoded)
				tools.app401error(res,"Authorization Failed")				
			if(!decoded.app)
			tools.app401error(res,"Authorization Failed")

			//Pass Verified data to App User
			req['app_user'] = decoded
		
		})			

}
	next();			 
}			 	
