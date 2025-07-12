const express=require('express');
const router=express.Router();


const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);






// methods for uploading images

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
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

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// show all products
router.get('/',async(req,res)=>{


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


// create product

router.post('/', upload.array('images',3), async(req,res)=>{




    try{



        const{name,description,price,stock,category}=req.body;
        const duplicateName=await Product.find({name:name});

        if(duplicateName.length>0){
            console.log(duplicateName);

            return res.status(409).json({error:"Name already exist"});
        }

        if(!req.files || req.files.length===0){


            return res.status(400).json({error:"No images Uploaded"});
        }


          // Create image objects matching your schema
    const imageObjects = req.files.map((file, index) => ({
      url: file.filename,  // Store the filename as URL
      alt: file.originalname || `${title} image ${index + 1}`,  // Use original name or generate alt text
      isPrimary: index === 0  // First image is primary
    }));

        const product= new Product({name,description,price,stock,category,images:imageObjects});


       
       await product.save();


       res.json({message:'Product Uploaded',product:product});


    }

    catch(error){

        if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

            res.status(500).json({error:error.message})
    }




});


router.delete('/delete/:id',async(req,res)=>{



try{

const product= await Product.findById(req.params.id);

if(!product){

    return res.status(404).json({error:"Product not found"});
}





    if(product.images && product.images.length>0){

        const deletePromise=product.images.map(async(imageObj)=>{

        const filePath = path.join('uploads/products', imageObj.url); // Fixed typo: 'producs' -> 'images'

        try{

            await unlinkAsync(filePath);
        }
        catch(error){

      console.error(`Error deleting image ${imageObj.url}:`, error);
          // Don't throw error - continue deleting other images
        

        }
await Promise.allSettled(deletePromise);


        })



    }

    await Product.findByIdAndDelete(req.params.id);



    res.json({message:"Successfully Deleted"});


}

catch(error){


    res.status(500).json({error:error.message});



}


})




module.exports=router;


