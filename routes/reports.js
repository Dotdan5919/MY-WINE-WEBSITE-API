const express=require('express');

const Report=require('../models/Reports');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router=express.Router();







const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
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
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false);
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





router.get('/',async(req,res)=>{


try{

    const reports=await Report.find();

    res.json(reports);

}

catch(error){



    res.status(500).json({error:error.message})
}



});

router.post('/',upload.single,async(req,res)=>{

    try{

const {name,description,img}=req.body;


const report=new Report({name,description,url:img.filename});

await report.save();
res.json({message:"Report Created"});

}
catch(error){



    res.status(500).json({error:error.message});
}

}



);






module.exports=router;