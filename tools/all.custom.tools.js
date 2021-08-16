
//Jwt token generator 
var jwt = require('jsonwebtoken');
//Import Configurations
var config = require('../config/all.config.js');
//Creates A unique random Code
//model is the tablename ,column is the field name on the table ,len is the length of the code represented in multiple of 10's
exports.uniqueCode = async (model,column,len=1000000000) =>{
    let unique = true;
    let codeValue = Math.floor(Math.random() * len)
    while(unique)
    {     
    await model.findOne({column: codeValue})
    .then(data =>{
        if(!data)
            unique = false
    })
    .catch(err =>{
        console.log("Error Occured in UniqueCode ${err}");
        unique = false
    })
    }
    return codeValue;
}

exports.computeBill = (cdata)=>
{

    //Get amount by multiplying charge by rate ( charge represent number of litre(s)/KWH  and rate is how much per litre / KWH)
    let amount = (cdata.charge * cdata.rate)
    //Compute vat (note: vat is in percentage)
    let vat_amount = (cdata.vat/100) * amount
    //Add Vat to total bill amount		
    amount += vat_amount
    
    return amount
}


exports.computeVat = (cdata)=>
{

    //Get amount by multiplying charge by rate ( charge represent number of litre(s)/KWH  and rate is how much per litre / KWH)
    let amount = (cdata.charge * cdata.rate)
    //Compute vat (note: vat is in percentage)
    let vat_amount = (cdata.vat/100) * amount
    
    return vat_amount
}


//This is a quick tool to check if a record exists
//model is the tablename
//data : the record you want to check on the table
//return_data: if you want to return the record object if it exists
//return_data = false will return just boolean

exports.exists = async (table,data,return_data=false) =>{
    let exists = false
    var model;    
	try{
		model = require(`../model/${table}.model.js`);
	}catch(err){
		return {error:"Model Not found"}
	}
    console.log(data)
    var response = {}
    //Check for empty data
    if(!data)
        return {error :"Empty Data sent to all.custom.tool.exists expecting an object with records"}
    //enforcing only object to be sent
    if(typeof data != 'object')
        return {error:"nor object Data sent to all.custom.tool.exists expecting an object with records"}
    //Check if object is empty
    
    if(data.length == 0)
        return {error:"Empty Data sent to all.custom.tool.exists expecting an object with records"}
        console.log(data)
        let d = new Date()
        console.log(` eXECfindOne  ${d.getTime()}`)
          await model.findOne(data,(err,rec) =>{
            if(err)
                response = {error:err}
            
            console.log(` findOne ${rec} ${d.getTime()}`)
         
            if(!rec)
        {            
            response = {result:false}
        }
        else{

            if(rec.length == 0)  
                response = {result:false}

            if(return_data)
                response = {result:rec}
            else{
                response = {result:true}
            }
        }        
    })
    return response 
    

};
//Create New Records In A model
exports.create_record = async (table,data) =>{
    var model;    
    try{
        model = require(`../model/${table}.model.js`);
    }catch(err){
        return {result:"Model Not found"}
    }
    var updated = false
    var response = {}
    //Check for empty data
    if(!data)
    return {error:"Empty Data sent to all.custom.tool.exists expecting an object with records"}
    //enforcing only object to be sent
    if(typeof data != 'object')
        return {error:"nor object Data sent to all.custom.tool.exists expecting an object with records"}
    //Check if object is empty
    if(data.length == 0)
        return {error:"Empty Data sent to all.custom.tool.exists expecting an object with records"}
    let create = new model(data);
    //Save Users                  
    await create.save()
    .then(records => {
        console.log(records)
        response = records
    
    })              
    .catch(err =>{
    console.log(err)
        response = {error:`Data Creation on ${table} failed, because ${err}`}
    })
    return response
}

exports.save_user_and_create_token = async (table,data) =>{
    var model;    
    try{
        model = require(`../model/${table}.model.js`);
    }catch(err){
        return {result:"Model Not found"}
    }
    var response = {}
    var updated = false
  
    let usertokens = {}		
    //Assign token for APP usage
    usertokens['apptoken'] = jwt.sign({username:cdata.username,application:config.app_name,id:cdata._id,app:true},config.appjwtsecret)              
    
    
    //Share assigntoken with created users response data
    cdata['apptoken'] = usertokens['apptoken']  
    
    //Update Token For User
    let rtrn ;
    await model.updateOne({_id:cdata._id},usertokens)
    .then(rtrn =>{

       
        if(!rtrn)       
            response = {error:`User was created but token update failed`}
        if(rtrn.n > 0 || rtrn.nModified > 0)
            response = cdata
        else
            response = {error:`User was created but token update failed`}                
    })
    .catch(err =>{                
        console.log(err)
        response = {error:`User was created but token update failed because ${err}`}                                   
    })            
    return response                                                                                                                       
};

exports.updateArrears = async (res,type,cus_id,newarrears)=>{
    let update = {}
    console.log(cus_id)
    switch(type){
    case 'water':									
        update = await exports.updateById(res,'customers',cus_id,{'water_arrears':newarrears})
    break;
    case 'electricity':					
        update = await exports.updateById(res,'customers',cus_id,{'elect_arrears':newarrears})
    break;
    default:
        update = {error:"Type Not Found. Unable to update arrear"}
    break;    
	}
    return update
}
exports.prevNnewArrears = (res,type,customer,amount,model,reverse=false)=>{
    let newarrear = 0
    //Set Previous Arrears Value base on what is the bill is for
   
    response = {}
	switch(type){
    case 'water':
        if(reverse){
            response['new'] = model == 'transaction' ? (customer.water_arrears + amount  ) : (customer.water_arrears - amount)
            response['prev'] = customer.water_arrears
            return response
        }else{
            response['new'] = model == 'transaction' ? (customer.water_arrears - amount  ) : (customer.water_arrears + amount)
            response['prev'] = customer.water_arrears
            return response
        }
        
    break;
    case 'electricity':
        if(reverse){
            response['new'] = model == 'transaction' ? (customer.water_arrears + amount  ) : (customer.water_arrears - amount)
            response['prev'] = customer.elect_arrears
            return response
        }
        else{
            response['new'] = model == 'transaction' ? (customer.elect_arrears - amount) : (customer.elect_arrears + amount)
            response['prev'] = customer.elect_arrears
            return response
        }
    break;
    default:
        //..
        return exports.app500error(res,`selection code (${type}) not found`)
        break;

    }
}
//Update Table By Id
exports.updateById = async (res,table,id,update) =>{
    response = {}
    var model;    
	try{
		model = require(`../model/${table}.model.js`);
	}catch(err){
		return {error:`Model Not found ${table}`}
	}
    var updated = {}
      //Check for empty data
      if(!update)
            return {error:"Empty Data sent to all.custom.tool.updatebyid expecting an object with records"}
    //enforcing only object to be sent
    if(typeof update != 'object')
        return {error:"nor object Data sent to all.custom.tool.updatebyid expecting an object with records"}
    //Check if object is empty
    if(update.length == 0)
        return {error:"Empty Data sent to all.custom.tool.updatebyid expecting an object with records"}            
    //Update Row By ID                        
    await model.updateOne({_id:id},update)
    .then(rtrn =>{       
                         
        if(!rtrn)
            updated = {result:false}
        if(rtrn.n > 0 || rtrn.nModified > 0)
            updated = {result:true}
        else
            updated = {result:false}                           
    })                             
    .catch(err =>{                
        console.log(err)
        updated = {result:false}
    })
    return updated
}

exports.app500error = (res,err)=>{
    res.status(500).json({responseCode:500,error:err});   
}

exports.app400error = (res,err)=>{
    res.status(400).json({responseCode:400,error:err});   
}

exports.app401error = (res,err)=>{
    res.status(401).json({responseCode:401,error:err});   
}

