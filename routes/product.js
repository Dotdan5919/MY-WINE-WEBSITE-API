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




})



// edit blog


router.post('/update/:id',upload.single('featured_image'),async(req,res)=>{


try{

   
    
    const {title,content}=req.body;


    const updater={}

    if(title){
updater.title=title;
    }

    if(content){


        updater.content=content;
    }



    if(req.file)
    {
    
    const file=await Blog.findById(req.params.id);
    
    if(file && file.featured_image)
    {
    
    const oldFilePath= path.join('uploads/images',file.featured_image);
    
    fs.unlink(oldFilePath,(err)=>{
    
    if(err) console.error('Error deleting old file',err);
    
    });
    
    
    }
    
    
    updater.featured_image=req.file.filename;
    
    }


    const UpdateBlog=await Blog.findByIdAndUpdate(req.params.id,updater,{new:true,runValidators:true});



    if(!UpdateBlog){


        return res.status(404).json({error:"Blog not found"});
    }

    await UpdateBlog.save();

    res.json({message:"User Updated"},UpdateBlog);





}

catch(error)
{



    res.status(500).json({errror:error.message});
}





})


//  like blog
router.post('/like/:id',upload.none(),async(req,res)=>{

try{
const blog=await Blog.findById(req.params.id);

const adminId=req.admin.id;

if(!blog){



  return  res.status(404).json({error:"Blog not found"});
    
}


const alreadyLiked=blog.likers.includes(adminId);

if(alreadyLiked){


    blog.likers=blog.likers.filter(id=>!id.equals(adminId));
    blog.likes-=1;
    await blog.save();

    res.json({message:"Blog unliked",likes:blog.likes});
}
else{


    blog.likers.push(adminId);
    blog.likes +=1;
    await blog.save();

    res.json({message:"Blog liked",likes:blog.likes});
}




}
catch(error){
    
    res.status(500).json({error:error.message});



}



});



// delete blog


router.delete('/delete/:id',async(req,res)=>{



try{

const blog= await Blog.findById(req.params.id);

if(!blog){

    return res.status(404).json({error:"Blog not found"});
}


if(blog.featured_image)
{

    const filePath=path.join('uploads/images',blog.featured_image);

    try{
await unlinkAsync(filePath);
}


catch(error){


    console.error('Error deleting file',error);

}
    


}



    await Blog.findByIdAndDelete(req.params.id);



    res.json({message:"Successfully Deleted"});


}

catch(error){


    res.status(500).json({error:error.message});



}


})




module.exports=router;


