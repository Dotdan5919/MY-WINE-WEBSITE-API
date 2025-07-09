const express=require('express');

const Report=require('../models/Reports');
const router=express.Router();





router.get('/',async(req,res)=>{


try{

    const reports=await Report.find();

    res.json(reports);

}

catch(error){



    res.status(500).json({error:error.message})
}



})






module.exports=router;