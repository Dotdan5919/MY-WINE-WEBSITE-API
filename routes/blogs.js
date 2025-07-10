const express=require('express');


const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router=express.Router();
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);






// methods for uploading images

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

// File filter (optional)
const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [ 'image/jpeg','image/png','image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF  are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});



router.post('/', upload.single('featured_image'), async(req,res)=>{




    try{



        const{title,content}=req.body;





        const blog= new Blog({title,content,featured_image:req.file.filename,status:"Published",author_id:req.admin.id});

       
       await blog.save();


       res.json({message:'Blog Uploaded',blog:blog});


    }

    catch(error){

        if (req.file) {
              fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
              });
            }



            res.status(500).json({error:error.message})
    }




})


module.exports=router;


