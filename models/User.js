const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');

// original schema
const userSchema = new mongoose.Schema( {



        username:{

            type:String,
            required:[true,'Username is required'],
            trim:true,
            unique:true,
            minlength:3,
            maxlength:30



        },
        email:{

            type:String,
            required:true,
            unique:true,
            lowercase:true,
             validate: {
      validator: function(v) {
        return /\S+@\S+\.\S+/.test(v);
      },
      message: 'Invalid email format'
    }


        },

       password:{

            type:String,
            minlenght:6,
            select:false


        },

        role:{

            type:String,
            require:true,
            enum:['user','admin'],
            default:'admin'

        },
         refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days in seconds
    }
  }]
    },
{
    timestamps:true
}




    
);


// for hashpassword

userSchema.pre('save',async function(next){

    if(!this.isModified('password') ) return next();

    try{

        const hashPassword= await bcrypt.hash(this.password,12);
        this.password=hashPassword;
        next();




    } catch(error){



        next(error)
    }






});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate user response (without sensitive data)
userSchema.methods.toAuthJSON = function() {
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        role: this.role,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email }).select('+password');
    
    if (!user) {
        throw new Error('Invalid credentials');
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }
    
    return user;
};

module.exports=mongoose.model('User', userSchema);