const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        unique:true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
  
    // Pricing
    price: {
        type: Number,
        required: true,
        min: 0
    },

    // Inventory
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
   
 
    // Categories and Organization
    category: {
        type: String,
        ref: 'Category',
        required: true
    },
  
   
    
    
    // Images and Media
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    
   
    
  
    
    
   
    
    // Status and Visibility
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft', 'discontinued'],
        default: 'active'
    },
   
    isFeatured: {
        type: Boolean,
        default: false
    },
    
    // SEO Fields
    seo: {
        title: String,
        metaDescription: String,
        keywords: [String]
    },
    
    // Sales and Analytics
    totalSales: {
        type: Number,
        default: 0
    },
   
    
    // Dates
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
   
    
    

});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });

// Pre-save middleware to update slug and updatedAt
productSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }
    this.updatedAt = Date.now();
    next();
});



module.exports=mongoose.model('Product',productSchema);