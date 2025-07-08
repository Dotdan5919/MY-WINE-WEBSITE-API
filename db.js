const mongoose=require('mongoose');
require('dotenv').config();

const connectDB=async ()=>
{
try{

await mongoose.connect(process.env.MONGODB_URI);
console.log('MonogDB connected successfully');



}

catch(error){



console.error('MongoDB connection error',error.message);
process.exit();


}



};


module.exports=connectDB;