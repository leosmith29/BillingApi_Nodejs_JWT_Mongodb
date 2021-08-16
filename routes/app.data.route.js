module.exports = (app) => {

appdata = require('../controller/app.data.controller.js')

  
//Route to Create Users
app.post('/app/create/:model', appdata.create);

//Reverse A Bill / Transaction
app.post('/app/reverse/:model/:uid',appdata.reverseTrans)
//Route Get Reports
app.get('/app/report/:model/:cus_id',appdata.reports);

//Route To List selected Records
app.post('/app/list/:model',appdata.findByData);

//Route to view all records
app.get('/app/list/:model',appdata.findAll);

//Route to edit one record
app.put('/app/edit/:model/:id',appdata.findIdEdit);

//Route to view one record
app.get('/app/:model/:id',appdata.findId);

//route to delete a record by it's id
app.delete('/app/del/:model/:id',appdata.delete);

//route to delete a user
app.delete('/app/del/:model',appdata.deleteMany);
}