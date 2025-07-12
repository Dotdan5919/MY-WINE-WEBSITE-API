const mongoose=require('mongoose');

const commentSchema={

    

    comment:{

        type:String,
        required:true,
         maxLength:1000

    }
,
author_name:{

  type:String,
        required:true
      




},

author_id:{

type:String,
required:true


},

post_id:{

type:mongoose.Schema.Types.ObjectId,
ref:'Blog',
required:true

},

  // For nested replies
  parent_comment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // null for top-level comments
  },
  
  // Engagement
  likes: {
    type: Number,
    default: 0
  },
   likers:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
  
     }]
  ,
   // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  }







};



module.exports=mongoose.model('Comment',commentSchema)