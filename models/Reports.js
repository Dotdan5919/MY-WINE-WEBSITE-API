const  mongoose  = require("mongoose");
const bcrypt= require("bcryptjs");


const reportSchema={


    name:{

        require:true,
        minimum:3,
        type:String,
        unique:true
    },

    description:{

        type:String,
        require:true
    },

    url:{

        type:String,
        require:true

    }






}




module.exports=mongoose.model('Reports',reportSchema);


