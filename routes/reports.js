const express=require('express');

const Report=require('../models/Reports');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router=express.Router();
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);






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
  const allowedTypes = [ 'application/docx', 'application/pdf'];
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




// get
router.get('/',async(req,res)=>{


try{

    const reports=await Report.find();

    res.json(reports);

}

catch(error){



    res.status(500).json({error:error.message})
}



});


//upload report
router.post('/',upload.single('pdfreport'),async(req,res)=>{

    try{

const {name,description}=req.body;


const report=new Report({name,description,url:req.file.filename});

await report.save();
res.json({
      message: "Report Created",
      report: {
        id: report._id,
        name: report.name,
        description: report.description,
        url: report.url,
        file: {
          originalname: req.file.originalname,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      }
    });

}
catch(error){

     if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }


    res.status(500).json({error:error.message});
}

}



);



// delete report
router.delete('/delete/:id',async(req,res)=>
{


  try{
  const report=await Report.findById(req.params.id);

  if(!report)
  {

    res.status(401).json({error:"Report not found"});

  }


if(report.url){
  const filePath=path.join('uploads',report.url);
  try{

    await unlinkAsync(filePath);
    console.log('File deleted: ${filePath}');




  }

  catch(error){



    console.error('Error deleting file',error);
  }

  }


const deleteReport=await Report.findByIdAndDelete(req.params.id);

res.json({message:"Successfully Deleted"});


  }


  catch(error)
  {



    res.status(505).json({error:error.message});

  }






});



//update report

router.post('/update/:id',upload.single('pdfreport'),async(req,res)=>{


try{
const {name,description}=req.body;




const updateData={}
if(name){
  updateData.name=name;
}
if(description){

updateData.description=description;

}





if(req.file)
{

const file=await Report.findById(req.params.id);

if(file && file.url)
{

const oldFilePath= path.join('uploads',file.url);

fs.unlink(oldFilePath,(err)=>{

if(err) console.error('Error deleting old file',err);

});


}


updateData.url=req.file.filename;

}



const UpdateReport=Report.findByIdAndUpdate(req.params.id,updateData,{new:true,runValidators:true});


if(!UpdateReport){


  return res.status(404).json({error:"Report not found"});
}



res.json({message:"Report Updated Successfully"});





}
catch(error){

res.status(500).json({error:error.message});


}



});








// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 5MB)' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' });
    }
  }
  
  // Handle file filter errors
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: error.message });
});



module.exports=router;