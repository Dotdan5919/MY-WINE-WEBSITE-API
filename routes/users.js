const express=require('express');
const User= require('../models/User');
const { findOneAndDelete } = require('../models/User');
const router=express.Router();

// get all users
router.get('/',async(req,res)=>{

try{

    const users=await User.find();
    res.json(users);



}
catch(error){


    res.status(500).json({message:error.message});
}



});


// upload data

router.post('/',async(req,res)=>
{

try{
const users=new User(req.body);
const savedUser=await users.save();
res.status(201).json(savedUser);





}
catch(error){


res.status(400).json({message:error.message});


}



});



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



// delete by email
router.delete('/email/:email',async (req,res)=>


{
    try{
    const user= await User.findOneAndDelete(req.params.email);

    if(!user)
    {

        res.status(404).json({error:'User not found'});

    }
    res.json({message:"User Deleted"});


    }

    catch(e){


        res.status(500).json({error:e.message});


    }






})

// update by id
router.post('/:id', async (req,res)=>
{


    try{

        const user= await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true,runValidators:true}

        );

        if(!user)
        {

            res.status(404).json({error:"User not found"});

        }

        res.json({message:'User updated'},user);



    }

    catch(error) 
    {

        res.status(500).json({error:error.message})


    }





})

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
//find by email

router.get('/email/:email',async (req,res)=>{

try{

    const user=await User.findOne({'email':req.params.email});


    if(!user){

        res.status(404).json({error:"User Not found"});

    }

    res.json({message:"User found" ,user});

}

catch(error){


res.status(500).json({error:error.message});

}



});



module.exports=router;