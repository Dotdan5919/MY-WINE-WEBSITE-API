const express=require('express');
const router=express.Router();


const Product = require('../models/Product');


const {upload,storage,path,fs,promisify,unlinkAsync}=require('../fileuploadhandler.js');






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

// delete product
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

// update file

router.post('/update/:id', upload.array('images', 3), async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const updater = {};

    // Handle text fields
    if (name) updater.name = name;
    if (description) updater.description = description;
    if (price) updater.price = price;
    if (stock) updater.stock = stock;
    if (category) updater.category = category;

    // Check if product exists
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      // Clean up uploaded files if product doesn't exist
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      }
      return res.status(404).json({ error: "Product not found" });
    }

    // Check for duplicate name (excluding current product)
    if (name) {
      const duplicateName = await Product.find({ 
        name: name, 
        _id: { $ne: req.params.id } 
      });
      if (duplicateName.length > 0) {
        // Clean up uploaded files if name already exists
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
              if (err) console.error('Error deleting file:', err);
            });
          });
        }
        return res.status(409).json({ error: "Name already exists" });
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Delete old images first
      if (existingProduct.images && existingProduct.images.length > 0) {
        const deletePromises = existingProduct.images.map(async (imageObj) => {
          const filePath = path.join('uploads/products', imageObj.url);
          try {
            await unlinkAsync(filePath);
          } catch (error) {
            console.error(`Error deleting old image ${imageObj.url}:`, error);
          }
        });
        await Promise.allSettled(deletePromises);
      }

      // Create new image objects
      const imageObjects = req.files.map((file, index) => ({
        url: file.filename,
        alt: file.originalname || `${name || existingProduct.name} image ${index + 1}`,
        isPrimary: index === 0
      }));

      updater.images = imageObjects;
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updater,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
});



module.exports=router;


