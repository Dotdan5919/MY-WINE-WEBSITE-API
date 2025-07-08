// db

const mongoose=require('mongoose');
require('dotenv').config();

const connectDB=async=>{


    await mongoose.connect(process.env.MONGOOS_URI);
    console.log("unsuccesful");
    




}