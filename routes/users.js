const express=require('express');
const User= require('../models/User');
const { findOneAndDelete } = require('../models/User');
const   bcrypt  = require('bcryptjs');
const router=express.Router();


// get all users (for admin only)
router.get('/',async(req,res)=>{

try{
// if admin is loggedin
    if(req.user.role==="admin"){
    const users=await User.find();
    res.json(users);

}
else{


    res.status(403).json({error:"Path Forbidden"});
}

}
catch(error){


    res.status(500).json({message:error.message});
}



});


// upload data

// router.post('/',async(req,res)=>
// {

// try{
// const users=new User(req.body);
// const savedUser=await users.save();
// res.status(201).json(savedUser);





// }
// catch(error){


// res.status(400).json({message:error.message});


// }



// });



// delete by id

router.delete('/:id',async(req,res)=>{


try{

    if(req.user.role==="admin"){ 
    const user=await User.findByIdAndDelete(req.params.id);

    if(!user)
    {

        return res.status(404).json({error:'User not found'});
    }
    

    res.json({message:'User deleted successfully'});

}

else{

    res.status(403).json({error:"Forbidden"});
}



}

catch(error)
{

    res.status(500).json({error:error.message});



}



});




// update by id
router.post('/:id', async (req,res)=>
{


    try{

    //    not req.user(this is from the token) req.params (this is from the filled form)

        const user= await User.findById(req.params.id);
// if the user that is logged in is the same as the user that wants to update
 if(req.user.id===user.id){

        if(!user)
        {

            res.status(404).json({error:"User not found"});

        }


        else{

         if(!req.body.password)
         {


             user.set(req.body);
            await user.save();
             res.json({message:'User updated'},user);
         }
         
           res.status(403).json({message:"forbidden"});
           
           
           
        }
    }
    else{
        
        res.status(403).json({message:"forbidden"});

        
       }



    }

    catch(error) 
    {

        res.status(500).json({error:error.message})


    }





})


// update password

router.post('/password/:id',async(req,res)=>{

try{

    
    const user=await User.findById(req.params.id).select('+password');
if(req.user.id=== user.id){

    if(!user)
    {

        res.status(404).json({error:"User Not found"});
    }

const isPasswordValid=await bcrypt.compare(req.body.oldpassword,user.password);

if(!isPasswordValid){

res.status(401).json({error:"Password Incorrect"});

}

user.password=req.body.newpassword;

await user.save();

res.json({message:"Password Changed"});
    

}

else{


    res.status(403).json({error:"Path Forbidden"});
}





}
catch(error)
{



    res.status(505).json({error:error.message});
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
//find by email

// router.get('/email/:email',async (req,res)=>{

// try{

//     const user=await User.findOne({'email':req.params.email});


//     if(!user){

//         res.status(404).json({error:"User Not found"});

//     }

//     res.json({message:"User found" ,user});

// }

// catch(error){


// res.status(500).json({error:error.message});

// }



// });



module.exports=router;