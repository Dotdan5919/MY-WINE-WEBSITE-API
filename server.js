const express=require('express');
const connectDB= require('./db');
const userRoutes=require('./routes/users');
const User=require('./models/User');
const jwt= require('jsonwebtoken');
require('dotenv').config();

const app=express();
const PORT=process.env.PORT ||3000;
const JWTSecret=process.env.JWT_Secret;


connectDB();


// Middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));


const authenticateToken=(res,req,next)=>{


    const authHeader=req.header['authorization'];
    const token=authHeader && authHeader.split(' ')[1];

    if(!token){


        return res.status(401).json({error:'Access Token required'});
    }

    jwt.verify(token,JWTSecret,(err,user)=>
    {

        if(err){


            return res.status(403).json({error:'Invalid or expired token'})

        }
        req.user=user;
        next();

    }
    
    )




};

const generateToken=(userId)=>{

return jwt.sign(
{id:userId},
JWTSecret,
{expiresIn:'24h'}




);


};



app.post('/api/register',async(req,res)=>{


    try{

        const {username,email,password,role}=req.body;

        const existingUser=await User.findOne(
{

$or:[{email},{username}]

}

        );

        if(existingUser){

            return res.status(404).json({error:'User with this email or username already exist'});

        }

        const user=new User({username,email,password,role:role ||'admin'});


        await user.save();


        const token=generateToken(user.id);


        res.status(201).json({message:'User registered Successfully',user:user.toAuthJSON(),token});





    }



    catch(error){


        res.status(500).json({error:error.message})


    }



})



// app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Express + MongoDB connected!');
});

app.listen(PORT,()=>{

console.log(`Server is running on ${PORT}`);


})

