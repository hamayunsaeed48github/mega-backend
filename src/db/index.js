import mongoose from "mongoose";
import { DB_NAME } from "../constant.js"; 

const connectDb = async ()=>{
    try {
        // basically mongoose yehan py aik object return kr raha hai
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Mongodb is connected ${connectionInstance.connection.host}`)

        
    } catch (error) {
        console.log("Database cannot connect",error);
        process.exit(1);
    }
}

export default connectDb;