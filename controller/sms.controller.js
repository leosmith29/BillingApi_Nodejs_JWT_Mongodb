const request = require('request')
const tools = require('../tools/all.custom.tools.js')
const smstools = require('../tools/sms.gateway.tools.js')

exports.sendsms = async (res,phone,purpose,payload,name,narrears)=>{
    let message = ""
    let arrears = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(narrears)
    if(purpose == 'billing'){
        
        let billed_amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tools.computeBill(payload))
        let vat_amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tools.computeVat(payload))
        
        message = `\nHello ${name} you have a new ${payload.billtype} bill\nBill Date : ${payload.createdAt}\nConsumption: ${payload.charge}\nRate: ${payload.rate} \nVat: ${vat_amount} \n\nTotal Bill: ${billed_amount} \n\nCurrent Arrears: ${arrears}`
    }
    else if(purpose == 'transaction'){
        let trans_amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload.amount)        
        let prev = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload.prev_arrears)
        message = `\nHello ${name} your payment for your ${payload.pay_for} bill was successful\nTrans Date : ${payload.createdAt}\nAmount: ${trans_amount}\nPrevious Arrears: ${prev}\n\nCurrent Arrears: ${arrears}`
 
    }
    else{
        return false
    }
    let params = ''
    Object.entries(smstools.params).map(field =>{
        params = `${params}&${field[0]}=${field[1]}`
    })
    var created_row = payload
    await request.get(`${smstools.url}?${smstools.phone_field}=${phone}&${smstools.message_field}=${message}&${params}`,(err,resp,res_text)=>{
        if(err){
            console.log(err)
            created_row['sms'] = false
            return res.status(200).json(created_row); 
        }
        if(res_text){
         
				if(!res_text.includes(smstools.success_text)){					
					console.log(` Sms Failed to send `)                    
					created_row['sms'] = true
					return res.status(200).json(created_row);
				}
				else{
					console.log(` Sms was sent`)
					created_row['sms'] = true
					return res.status(200).json(created_row);
				}
            }
    })
    
}