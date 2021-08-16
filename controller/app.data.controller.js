//Import System User Model
var Users = require('../model/users.model.js');
//Import Transaction Model
var Transaction = require('../model/transaction.model.js');
//Import Billing Model
var Billing = require('../model/billing.model.js');
//Import Customer Model
var Customer = require('../model/customers.model.js');
//Jwt token generator 
var jwt = require('jsonwebtoken');
//Import Configurations
var config = require('../config/all.config.js');
//import Custom tools
var tools = require('../tools/all.custom.tools.js')
//fetch the sms control 
// for sms notification 
//on bill and transaction when sms is true
//You Can update the sms gateway @ ../tools/sms.gateway.tools.js 
var sms = require('./sms.controller.js')
//Authenticator
bcrypt = require('bcryptjs')

exports.create = async (req,res) =>{
	if(!req.body)
	{
		tools.app500error(res,"Data Can't be empty")	
	}
	var data = req.body
	console.log()
	//Check If Password is path of the Payload to Encrypt
	if(data.password)
		data['password_encrypt'] = bcrypt.hashSync(data.password,8)

	let customer;
	//Select Model To Use
	var model;
	let model_name = ''
	var created_row  = {}
	var newarrears = 0
	let d = new Date()
	if(req.params.model){
		model_name = req.params.model
		try{
			model = require(`../model/${model_name}.model.js`);
		}catch(err){
			return tools.app500error(rec,"Model Not found")
		}

		//Validation
		if(model_name == "users"){
		if(data.username){
		let exists = {}
		exists =  await tools.exists('users',{username:data.username})
		console.log(exists)			
		if(exists.result)		
				return tools.app500error(res,"Username already exists")	
		}													
		else{
			return tools.app500error(res,"Username can't be empty")	
		}
	}
		

		//Create Unique Account Number for Customer		
		if(model_name == 'customers')		
			data['account'] = await tools.uniqueCode(model,'account',1000000);		
		//Validate if customer id provided for bill/trans belongs to a customer
		if(model_name == 'billing' || model_name == 'transaction'){
		//check if customer exists
		if(!data.customer_id)
			return tools.app500error(res,"customer_id can't be empty")
		customer =  await tools.exists('customers',{_id: data.customer_id},true)
		if(customer.error || !customer.result)
			return tools.app500error(res,"customer doesn't exists")
		console.log(customer)
		//Validate Posted Data
		//Set bill types
		let types = model_name == 'billing' ? data.billtype  : data.pay_for
		
		if(!types)
			return tools.app500error(res,"type can't be empty")
		if(!config.billtype.includes(types))
			return tools.app500error(res,`type selection doesn't exists use any of the following (${config.billtype})`)
		//Compute bill
		if(model_name == 'billing'){
			data['vatamount'] = tools.computeVat(data)
			data['billamount'] = tools.computeBill(data)
		}
		let amount = model_name == 'billing' ? data.billamount : data.amount
		//Set Prev Arrears and new arrears
		prevnnewarrears = tools.prevNnewArrears(res,types,customer.result,amount,model_name)
		data['prev_arrears'] = prevnnewarrears.prev
		newarrears = prevnnewarrears.new		
		}		
	}
	else
		return tools.app500error(res,"Model not set")
		
	//Log the user creating this record
	if(req.app_user)
	data['createdby'] = req.app_user.id;

	//Create Data						
	created_row = await tools.create_record(model_name,data)
	if(created_row.error)
		return tools.app500error(res,created_row.error)

	// generate auth token for user
	if(model_name == 'users'){	
		console.log(` Create User  ${d.getTime()}`)
		created_row = await tools.save_user_and_create_token(model_name,created_row)	
		if(created_row.error)
			return tools.app500error(res,created_row.error)
	}
	//Update Customer Arrears and send sms if true
	else if(model_name == "billing" || model_name == "transaction"){
	let type = model_name == 'billing' ? data.billtype : data.pay_for
			
	//Check if arrears update was successfull
	let update = await tools.updateArrears(res,type,customer.result._id,newarrears)
	if(!update.result || update.error){
		return tools.app500error(res,update)
	}
	else{
		//Send SMS 
		if(data.sms){			
			await sms.sendsms(res,customer.result.phone,model_name,created_row,customer.result.name,newarrears)
		}
		else{
			//Return Created Data
			console.log(` Createdata final `)
			return res.status(200).json(created_row);
		}
	}				
	}
	else{
		//Return Created Data
		console.log(` Createdata final  ${d.getTime()}`)
		return res.status(200).json(created_row);
	}
	
};


exports.findByData = (req,res) =>{
	
	if(!req.body)
		tools.app500error(res,"Body of post can't be empty")
	let searchData = req.body
	//
	if(!req.params.model)
		tools.app500error(res,"No model Selected")
	//Set Model
	var model;
	var model_name = req.params.model
	//Fetch model
	try{
		model = require(`../model/${model_name}.model.js`);
	}catch(err){
		tools.app500error(res,"Model Not found")
	}


	//Search Record
	model.find(searchData)
	.then(data =>{
		res.status(200).json(data)
	})
	.catch(err =>{
		console.log(err)
		tools.app500error(res,"An error occured during search")
	})
	
};

exports.reports = async (req,res)=>{
	if(!req.params.model)
		return tools.app500error(res,"No model Selected")
	var model;

	
	var model_name = req.params.model
	if(!req.params.cus_id){
		return tools.app500error(res,"Please Provide Customer ID")
	}
	try{
		model = require(`../model/${model_name}.model.js`);

	}
	catch(err){
		return tools.app500error(res,"Model Not found")
	}
	let cus_id = req.params.cus_id
	//Get Customer
	let customer = await tools.exists('customers',{_id:cus_id},true)
	if(customer.result){
		var response_data = {'customerName':customer.result.name,'customerWaterArrears':customer.result.water_arrears,'customerElectArrears':customer.result.elect_arrears}
		
		switch(model_name){
			case 'billing':	
				await model.find({customer_id:cus_id},{'bill_uid':1,'charge':1,_id:0,'rate':1,'vat':1,'prev_arrears':1,'createdby':1,'createdAt':1,'reversed':1,'billamount':1,'vatamount':1})
				.then(data =>
				{
					var recs = []
					data.map(d =>{
				
						recs.push(d)
					})
					response_data['bills'] = recs
					return res.status(200).json(response_data)
				})
				.catch(err =>{
					return tools.app500error(res,err)
				})
				break;
			case 'transaction':
				await model.find({customer_id:cus_id},{'trans_uid':1,_id:0,'amount':1,'prev_arrears':1,'createdby':1,'createdAt':1,'reversed':1})
				.then(data =>
				{
					response_data['transactions'] = data
					res.status(200).json(response_data)
				})
			.catch(err =>{
					return tools.app500error(res,err)
				})
				break;
			default:
				return tools.app500error(res,"Report Not found")
				
		}	
	}
	else{
		return tools.app500error(res,"Customer Not Found")
	}
	
}
exports.reverseTrans = async (req,res)=>{
	//get Model
	//Set Model
	if(!req.params.model)
		return tools.app500error(res,"No model Selected")
	var model;
	var model_name = req.params.model
	var reversed_comment = req.body

	if(!reversed_comment.comment){
		return tools.app500error(res,"Please Provide Comment For Reversal")
	}
	
	if(model_name != 'billing' && model_name != 'transaction'){
		return tools.app500error(res,"Reversal only works on posted transactions / posted bills")
	}
	try{
		model = require(`../model/customers.model.js`);

	}
	catch(err){
		return tools.app500error(res,"Model Not found")
	}

	//Get Bill or transaction to reverse
	if(req.params.uid){
		let uid = req.params.uid
		//Search for Trans / Bill
		let uid_search = model_name == 'billing' ? {bill_uid: uid} : {trans_uid: uid}
		record = await tools.exists(model_name,uid_search,true)
		console.log(record)
		if(record.result){
			let data = record.result
			let amount = model_name == 'billing' ? tools.computeBill(data) : data.amount
			//Check if record has already reversed
			if(data.reversed)
				return tools.app500error(res,`${model_name} has already being reversed`)
			//get Customer Current Arrears
			console.log(data.customer_id)
			 await model.findOne({_id:data.customer_id})
			.then(d =>{				
				if(!d){
					return tools.app500error(res,"Customer No Longer Exists")
				}
				let type = model_name == 'billing' ? data.billtype : data.pay_for
				let prevnnewarrears = tools.prevNnewArrears(res,type,d,amount,model_name,reverse=true)
				
				 
				//update arrears				
				let newarrears = prevnnewarrears['new']				
				tools.updateArrears(res,type,data.customer_id,newarrears)
				.then(update =>{
					if(!update.result || update.error){
						return tools.app500error(res,update)
					}
					else{
						//Update Reserve to true and post reason for reversal
						let reversal = {'reversed':true,'reversed_comment':reversed_comment.comment,'reversed_by':req.app_user.id}
						tools.updateById(res,model_name,data._id,reversal)
						.then(updComment =>{
							if(updComment.result){
								return res.status(200).json({'response': 'Record has been reversed','arrears':newarrears})
							}else{
								return tools.app500error(res,"Error Occured during comment posting")
							}
						})
						.catch(updComErr =>{
							return tools.app500error(res,`Error Occured during comment posting (${updComErr})`)
						})
					
			}
			})
			.catch(updErr=>{
					return tools.app500error(res,`Error Occur during ${model_name}`)				
			})
		})
			.catch(err =>{
				console.log(err)
				return tools.app500error(res,`Error Occur during ${model_name}`)
			})
		
		}
		else{
			return tools.app500error(res,"UID not found")
		}
	}
	else{
		return tools.app500error(res,"Please Provide a uid for the bill or transaction")
	}

}

exports.findAll = (req,res) =>{
	
	if(!req.params.model)
		tools.app500error(res,"No model Selected")
		console.log(`req.params.model ${req.params.model}`)
	//Set Model
	var model;
	var model_name = req.params.model
	
	try{
		model = require(`../model/${model_name}.model.js`);
	}catch(err){
		tools.app500error(res,"Model Not found")
	}

	//Search for Records
	model.find({})
	.then(data =>{
		res.status(200).json(data)
	})
	.catch(err =>{
		console.log(err)
		tools.app500error(res,"An error occured during search")
	})

};

exports.findIdEdit = (req,res) =>{
	//
	if(!req.body)
		tools.app500error(res,"Data Can't be empty")
	//
	if(!req.params.model)
		tools.app500error(res,"No model Selected")
	if(!req.params.id)
		tools.app500error(res,"ID is required for this proccess")
	var data = req.body
	var id = req.params.id
	//Set Model
	var model;
	var model_name = req.params.model
	try{
		model = require(`../model/${model_name}.model.js`);

	}catch(err){
		tools.app500error(res,"Model Not found")
	}

		//You can't edit a bill nor transaction it can only be reversed and a new bill/transaction created 
		//Because the record has already had an impact on the customer arrears ,
		// acount wise its advisable to reverse any incorrect or unwnated bill/transaction so as to keep your accounting aligned
		if(config.cant_edit.includes(model_name))
			return tools.app400error(res,"Action not allowed for model")
	model.findByIdAndUpdate(id,data,{new: true})
	.then(rtrn =>{
		if(!rtrn)
			return tools.app500error(res,"ID not found")
		else
			return res.status(200).json(rtrn)
		
		
	})
	.catch(err =>{	
			console.log("Error: ${err}")
			return tools.app500error(res,"an error occured")
	})

	};

	exports.findId = (req,res) =>{
		
		//
	if(!req.params.model)
		return tools.app500error(res,"No model Selected")
	if(!req.params.id)
		return tools.app500error(res,"ID is required for this proccess")
	var id = req.params.id
	//Set Model
	var model;
	var model_name = req.params.model
	//
	try{
		model = require(`../model/${model_name}.model.js`);

	}catch(err){
		tools.app500error(res,"Model Not found")
	}

	model.findById(id)
	.then(data =>
		{
			res.status(200).json(data)
		})
	.catch(err =>{	
			console.log("Error: ${err}")
			tools.app500error(res,"an error occured")
	})

};

exports.delete = (req,res) =>{
	//
	if(!req.params.model)
		tools.app500error(res,"No model Selected")
	if(!req.params.id)
		tools.app500error(res,"ID is required for this proccess")
	var id = req.params.id
	//Set Model
	var model;
	var model_name = req.params.model

	try{
		model = require(`../model/${model_name}.model.js`);

	}catch(err){
		tools.app500error(res,"Model Not found")
	}
	//same reason you can't edit a bill/transaction same reason you can't delete them.
	if(config.cant_edit.includes(model_name))
		tools.app400error(res,"Action not allowed for model")

	model.findByIdAndRemove(id)
	.then(deldata =>{
		if(!deldata)
			tools.app500error("Record Not Found with id ${id}")
			else
			{
				return res.json({message:"delete was successfull"})
			}
	})
	.catch(err =>{
		console.log("Error: ${err}")
		tools.app500error("An Error Occurred")	
	})
};

exports.deleteMany = (req,res) =>{
	//
	if(!req.params.model)
		tools.app500error(res,"No model Selected")
	
	//Set Model
	var model;
	var model_name = req.params.model
	try{
		model = require(`../model/${model_name}.model.js`);

	}catch(err){
		tools.app500error(res,"Model Not found")
	}
	//same reason you can't edit a bill/transaction same reason you can't delete them.
	if(config.cant_edit.includes(model_name))
		tools.app400error(res,"Action not allowed for model")

	model.deleteMany({})
	.then(deldata =>{
		if(!deldata)
			tools.app500error("Record Not Found with id ${id}")
			else
			{
				return res.json({message:"delete was successfull"})
			}
	})
	.catch(err =>{
		console.log("Error: ${err}")
		tools.app500error("An Error Occurred")	
	})
};