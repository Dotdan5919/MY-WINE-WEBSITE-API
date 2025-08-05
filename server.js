
const express=require('express');
const connectDB= require('./db');
const cors=require('cors');
const cookieParser = require('cookie-parser');



require('dotenv').config();




// routes
const userRoutes=require('./routes/users');
const adminRoutes=require('./routes/admin');
const reportRoutes=require('./routes/reports');
const blogRoutes=require('./routes/blogs');
const commentRoutes=require('./routes/comment');
const productRoutes=require('./routes/product');



// models
const User=require('./models/User');
const Blog=require('./models/Blog');
const Report=require('./models/Reports');
const Product=require('./models/Product');


const jwt= require('jsonwebtoken');
const crypto= require('crypto');
const bcrypt = require('bcryptjs');


const app=express();
const PORT=process.env.PORT ||8000;
const JWTSecret=process.env.JWT_SECRET;


connectDB();


// Middleware

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// 

const {upload,storage,path}=require('./fileuploadhandler');


const generateRefreshToken=()=>{


return crypto.randomBytes(64).toString('hex');

}


const userauthenticateToken = (req, res, next) => {
    let token;
    // Try to get token from cookie first
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else {
        // fallback to Authorization header
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ error: 'Access Token required' });
    }
    jwt.verify(token, JWTSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};



const adminauthenticateToken = (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ error: 'Access Token required' });
    }
    jwt.verify(token, JWTSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        if (user.role != 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.admin = user;
        next();
    });
};
const generateToken=(userId,role)=>{

return jwt.sign(
{id:userId,role},
JWTSecret,
{expiresIn:'24h'}




);


};


// routes available for guests
app.post('/api/register',async(req,res)=>{


    try{

        const {username,email,password,role}=req.body;

        const existingUser=await User.findOne(
{

$or:[{email},{username}]

}

        );

        if(existingUser){

            return res.status(409).json({message:'User with this email or username already exist'});

        }
         if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const user=new User({username,email,password,role:role });


       


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



app.post('/api/login', upload.none(), async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User.findOne({
            $or: [{ email }, { username: email }]
        }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }
        const token = generateToken(user.id, user.role);
        const refreshToken = generateRefreshToken();
        user.refreshTokens.push({
            token: refreshToken,
            createdAt: new Date()
        });
        await user.save();
        // Set cookies
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: user.toAuthJSON()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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


// show all products
app.get('/api/products',async(req,res)=>{


try{


    const product=await Product.find();


    if(!product){


        return res.status(404).json({message:"No product found"});
    }

    res.json(product);


}
catch(error){


    res.status(500).json({error:error.message});

}

});







app.use('/api/user',userauthenticateToken, userRoutes);

app.use('/api/admin',adminauthenticateToken, adminRoutes);

app.use('/api/reports',adminauthenticateToken,reportRoutes);

app.use('/api/blogs',adminauthenticateToken, blogRoutes);

app.use('/api/comment',userauthenticateToken,commentRoutes);
app.use('/api/products',adminauthenticateToken,productRoutes);





// Token refresh endpoint

app.post('/api/refresh-token', async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refreshToken;
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
        // Set new cookies
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({ message: 'Token refreshed' });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Logout endpoint
app.post('/api/logout', userauthenticateToken, async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refreshToken;
        const user = await User.findById(req.user.id);
        if (refreshToken) {
            user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
            await user.save();
        }
        // Clear cookies
        res.clearCookie('token');
        res.clearCookie('refreshToken');
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


});



