const express=require('express');
const router=express.Router();
const Comment= require('../models/Comment');

const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [ 'image/jpeg','image/png','image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF  are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});



router.get('/:postId',async(req,res)=>{


try{

const comment= await Comment.find({post_id:req.params.postId});


if(!comment){


    res.status(404).json({message:"comment not found"});
}



res.json(comment);




}

catch(error){



    res.status(404).json({error:error.message});
}



});
// create comment
router.post('/:postId', upload.none(), async(req,res)=>{



    try{

        console.log(req.body);
       


        const {comment,author_name,author_id}=req.body;

       const commentdata=new Comment({comment,author_name,author_id:req.user.id||req.admin.id,post_id:req.params.postId});
        await commentdata.save();
        
        res.json({message:"comment uploaded"});




    }

    catch(error){


        res.status(500).json({error:error.message});
    }


});


// update comment
router.post('/update/:postId',upload.none(),async(req,res)=>{

try{



const updateComment=await Comment.findOneAndUpdate(req.params.id,req.body,{new:true,runValidators:true});

if(!updateComment){


    res.status(404).json({error:"Not found"});

}

res.json({message:'user updated',update_user:updateComment},updateComment);
}
catch(error){


    res.status(500).json({message:error.message});
}




});

// update likes(on comment)
router.post('/like/:id',upload.none(),async(req,res)=>{

try{
const comment=await Comment.findById(req.params.id);

const userId=req.user.id;

if(!comment){



  return  res.status(404).json({error:"comment not found"});
    
}


const alreadyLiked=comment.likers.includes(userId);

if(alreadyLiked){


    comment.likers=comment.likers.filter(id=>!id.equals(userId));
    comment.likes-=1;
    await comment.save();

    res.json({message:"Comment unliked",likes:comment.likes});
}
else{


    comment.likers.push(userId);
    comment.likes +=1;
    await comment.save();

    res.json({message:"Comment liked",likes:comment.likes});
}




}
catch(error){
    
    res.status(500).json({error:error.message});



}



});

// delete comment

router.delete('/delete/:id',upload.none(),async(req,res)=>{

try{


const comment=await Comment.findByIdAndDelete(req.params.id);

if(!comment){


    return res.status(404).json({error:error.message});
}

res.json({message:"Comment deleted"});

}

catch(error){


    res.status(500).json({error:error.message});
}


});












module.exports=router;