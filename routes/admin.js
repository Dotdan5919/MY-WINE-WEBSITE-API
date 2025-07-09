const express=require('express');
const User= require('../models/User');
const { findOneAndDelete } = require('../models/User');
const   bcrypt  = require('bcryptjs');
const router=express.Router();









// get all users (for admin only)
router.get('/users',async(req,res)=>{

try{

    
    const users=await User.find();
    res.json(users);






}
catch(error){


    res.status(500).json({message:error.message});
}



});


router.get('/profile',async(req,res)=>{

    try{
const admin=await User.findById(req.admin.id);
res.json(admin);
}

catch(error){


    res.status(500).json({errror:error.message});
}




})




// delete by id

router.delete('/:id',async(req,res)=>{


try{

   
    const user=await User.findByIdAndDelete(req.params.id);

    if(!user)
    {

        return res.status(404).json({error:'User not found'});
    }
    

    res.json({message:'User deleted successfully'});





}

catch(error)
{

    res.status(500).json({error:error.message});



}



});


//find by id

router.get('/:id',async (req,res)=>{

try{

    const user=await User.findById(req.params.id);


    if(!user){

        res.status(404).json({error:"User Not found"});

    }

    res.json({message:"User Found" ,user});

}

catch(error){


res.status(500).json({error:error.message});

}



});



// update by id
router.post('/updateprofile', async (req,res)=>
{


    try{

        const admin= await User.findById(req.admin.id);

 


      

         if(!req.body.password)
         {


             admin.set(req.body);
            await admin.save();
             res.json({message:'Admin updated'},admin);
         }
         
           res.status(403).json({message:"forbidden"});
           
           
           
       
   
 



    }

    catch(error) 
    {

        res.status(500).json({error:error.message})


    }





})


// update password

router.post('/password',async(req,res)=>{

try{

    
    const admin=await User.findById(req.admin.id).select('+password');

 

const isPasswordValid=await bcrypt.compare(req.body.oldpassword,admin.password);

if(!isPasswordValid){

res.status(401).json({error:"Password Incorrect"});

}

admin.password=req.body.newpassword;

await admin.save();

res.json({message:"Password Changed"});
    





}
catch(error)
{



    res.status(505).json({error:error.message});
}


});


module.export=router