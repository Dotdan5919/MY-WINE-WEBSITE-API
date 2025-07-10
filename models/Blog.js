
const mongoose=require('mongoose');


const blogSchema={

    title:{type:String,unique:true,require:true},
    content:{type:String,require:true},
    featured_image:{type:String,require:true},
    status:{type:String,require:true,enum:['Draft','Published']},
   author_id:{type:String,require:true},







}



module.exports=mongoose.model('Blog',blogSchema);