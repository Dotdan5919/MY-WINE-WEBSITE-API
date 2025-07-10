const express=require('express');
const connectDB= require('./db');

require('dotenv').config();

// routes
const userRoutes=require('./routes/users');
const adminRoutes=require('./routes/admin');
const reportRoutes=require('./routes/reports');
const blogRoutes=require('./routes/blogs');

// models
const User=require('./models/User');
const Blog=require('./models/Blog');
const Report=require('./models/Reports');


const jwt= require('jsonwebtoken');
const crypto= require('crypto');
const bcrypt = require('bcryptjs');


const app=express();
const PORT=process.env.PORT ||3000;
const JWTSecret=process.env.JWT_SECRET;


connectDB();


// Middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const generateRefreshToken=()=>{


return crypto.randomBytes(64).toString('hex');

}

const userauthenticateToken=(req,res,next)=>{


    const authHeader=req.headers['authorization'];
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


const adminauthenticateToken=(req,res,next)=>{


    const authHeader=req.headers['authorization'];
    const token=authHeader && authHeader.split(' ')[1];

    

    if(!token){


        return res.status(401).json({error:'Access Token required'});
    }

    jwt.verify(token,JWTSecret,(err,user)=>
    {

       
        
        if(err){


            return res.status(403).json({error:'Invalid or expired token'})

        }

        if(user.role!='admin'){
            
            return res.status(403).json({error:'Admin access required'})
        }
        req.admin=user;
        next();

    }
    
    )




};
const generateToken=(userId,role)=>{

return jwt.sign(
{id:userId,role},
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
         if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const user=new User({username,email,password,role:role ||'admin'});


       


        const token=generateToken(user.id,user.role);
        const refreshToken=generateRefreshToken();

        user.refreshTokens.push({
            token:refreshToken,
            createdAt:new Date()


        });
         await user.save();


        res.status(201).json({message:'User registered Successfully',user:user.toAuthJSON(),token, refreshToken });





    }



    catch(error){


        res.status(500).json({error:error.message})


    }



});


app.post('/api/login',async (req,res)=>{


    try{
    const {email,password}=req.body;

    

    if(!email || !password)
    {


        res.status(400).json({error:'Email and password are required'});
    }



    const user=await User.findOne({

$or:[{email},{username:email}]

    }).select('+password');



    if(!user){

        return res.status(401).json({success:false,message:"Invalid Credentials"});


    }

    const isPasswordValid=await bcrypt.compare(password,user.password);

    if(!isPasswordValid){

        return res.status(401).json({error:"Invalid Credentials"});
    }


    const token=generateToken(user.id,user.role);

    const refreshToken=generateRefreshToken();
    user.refreshTokens.push({
        token:refreshToken,
        createdAt:new Date()


    });

    await user.save();
    res.status(200).json({

        success:true,
        message:'Login successful',
        user: user.toAuthJSON,
        token,
        refreshToken



    })

}


catch(error){


res.status(500).json({error:error.message});

}



});


app.get('/api/blogs',async(req,res)=>{


try{


    const blog=await Blog.find();
    if(!blog){


        res.status(404).json({error:"File not found"});
    }

    res.json(blog);
}

catch(error){




    res.status(500).json({error:error.message});
}

});


app.use('/api/user',userauthenticateToken, userRoutes);

app.use('/api/admin',adminauthenticateToken, adminRoutes);

app.use('/api/reports',adminauthenticateToken,reportRoutes);

app.use('/api/blogs',adminauthenticateToken, blogRoutes);




// Token refresh endpoint
app.post('/api/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const user = await User.findOne({
            'refreshTokens.token': refreshToken
        });

        if (!user) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Remove old refresh token
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);

        // Generate new tokens
        const newToken = generateToken(user.id, user.role);
        const newRefreshToken = generateRefreshToken();

        user.refreshTokens.push({
            token: newRefreshToken,
            createdAt: new Date()
        });

        await user.save();

        res.json({
            token: newToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
app.post('/api/logout', userauthenticateToken, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const user = await User.findById(req.user.id);

        if (refreshToken) {
            user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
            await user.save();
        }

        res.json({ message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.get('/', (req, res) => {
    res.send('Express + MongoDB connected!');
});

app.listen(PORT,()=>{

console.log(`Server is running on ${PORT}`);


})

