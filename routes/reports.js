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



});

router.post('/',async(req,res)=>{

    try{

const {name,description,url}=req.body;

// const report=new Report(req.body);

await report.save();
res.json({message:"Report Created"});

}
catch(error){



    res.status(500).json({error:error.message});
}

}



);






module.exports=router;