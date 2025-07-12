const express=require('express');
const User= require('../models/User');
const { findOneAndDelete } = require('../models/User');
const   bcrypt  = require('bcryptjs');
const router=express.Router();

const Blog=require('../models/Blog');





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

// view profile
router.get('/',async (req,res)=>{


    try{

const user=await User.findById(req.user.id);

res.json(user);

    }
    catch(error){


        res.status(500).json({error:error.message})
    }



});


// like blog
router.post('/like/:id',async(req,res)=>{

try{
const blog=await Blog.findById(req.params.id);

const userId=req.user.id;

if(!blog){



  return  res.status(404).json({error:"Blog not found"});
    
}


const alreadyLiked=blog.likers.includes(userId);

if(alreadyLiked){


    blog.likers=blog.likers.filter(id=>!id.equals(userId));
    blog.likes-=1;
    await blog.save();

    res.json({message:"Blog unliked",likes:blog.likes});
}
else{


    blog.likers.push(userId);
    blog.likes +=1;
    await blog.save();

    res.json({message:"Blog liked",likes:blog.likes});
}




}
catch(error){
    
    res.status(500).json({error:error.message});



}



});









module.exports=router;