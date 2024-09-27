import connectDb from "./db/index.js";
import dotenv from "dotenv";
import {app} from "./app.js";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

dotenv.config({
    path:"./.env"
});

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({
    limit:"16kb"
}));

app.use(express.urlencoded({extended:true,limit:"16kb"}));

app.use(express.static("public"));
app.use(express.cookieParser());


connectDb()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running on port ${process.env.PORT}`)
    });
    app.on("error",(error)=>{
        console.log("Error",error)
        throw err
    })
})
.catch((err)=>{
    console.log("Mongodb connection fail:",err)
})