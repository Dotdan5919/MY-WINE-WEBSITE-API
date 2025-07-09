const express=require('express');
const User= require('../models/User');
const { findOneAndDelete } = require('../models/User');
const   bcrypt  = require('bcryptjs');
const router=express.Router();






// update profile
router.post('/updateprofile', async (req,res)=>
{


    try{



         if(!req.body.password)
         {

            const user=await User.findById(req.user.id);

            
             user.set(req.body);
            await user.save();
             res.json({message:'User updated'},user);
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

    
    


const isPasswordValid=await bcrypt.compare(req.body.oldpassword,req.user.password);

if(!isPasswordValid){

res.status(401).json({error:"Password Incorrect"});

}
const user=await User.findById(req.user.id);
user.password=req.body.newpassword;

await user.save();

res.json({message:"Password Changed"});
    






}
catch(error)
{



    res.status(505).json({error:error.message});
}


});


router.get('/',async (req,res)=>{


    try{

const user=await User.findById(req.user.id);

res.json(user);

    }
    catch(error){


        res.status(500).json({error:error.message})
    }



});












module.exports=router;