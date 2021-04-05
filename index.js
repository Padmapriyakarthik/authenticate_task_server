
const express=require('express');
const app=express();
app.use(express.json());

require('dotenv').config();

const cors=require('cors');
app.use(cors());

const mongodb=require('mongodb');
const bcrypt=require('bcrypt');

const mongoClient=mongodb.MongoClient;
const objectId=mongodb.ObjectID;

const JWT = require("jsonwebtoken");
const JWT_SECRET =process.env.KEY;

const nodemailer=require('nodemailer');

const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'padmapriyakarthik97@gmail.com',
        pass:process.env.PASSWORD
    }
});

const dbUrl=process.env.DB_URL || "mongodb://127.0.0.1:27017";
const port=process.env.PORT || 4000;


app.post("/register", async (req,res)=>{
    
    const client = await mongoClient.connect(dbUrl);
    if(client){
        try {
           
            let {email}=req.body;
            const db = client.db("authenticate");
                const documentFind = await db.collection("users").findOne({email:req.body.email});
                if(documentFind){
                    res.status(400).json({
                        message:"User already Exists"
                    })
                }else{
                   
                    let salt=await bcrypt.genSalt(10);//key to encrypt password
                    let hash=await bcrypt.hash(req.body.password,salt);
                    req.body.password=hash;
                    let document=await db.collection("users").insertOne(req.body);
                    
                    if(document){ 
                       
                        let info = await transporter.sendMail({
                            from: 'padmapriyakarthik97@gmail.com', // sender address
                            to: req.body.email, // list of receivers
                            subject: "Hai!", // Subject line
                            html: '<h1>Welcome  </h1> <span> your resgistration is succesful </span>'
                          })
                        res.status(200).json({
                            "message":"registration successful"
                        })
                    }
                }
            client.close();
        } catch (error) {
            console.log(error);
            client.close();
        }
    }else{
        res.sendStatus(500);
    }
})

//login
app.post("/login",async(req,res)=>{
    const client=await mongoClient.connect(dbUrl);
    if(client)
    {   const {email}=req.body;
        try{
            let db=client.db("authenticate");
            let data=await db.collection("users").findOne({email:req.body.email});
            if(data)
            {
                console.log(objectId(data._id).getTimestamp())
                let isvalid =await bcrypt.compare(req.body.password,data.password);   
                if(isvalid)
                {

                        let info = await transporter.sendMail({
                            from: 'padmapriyakarthik97@gmail.com', // sender address
                            to: req.body.email, // list of receivers
                            subject: "Hai!", // Subject line
                            html: "<h3>Hello "+data.firstname+"</h3><p>Welcome you have successfully loggedin</p>", // html body
                        })
                        console.log(info);
                        res.status(200).json({message:"Login Success",email});
                    
                }
                else{
                    res.status(400).json({message:"Login Unsuccesful"})
                }
            }
            else{
                res.status(400).json({message:"User Does Not Exists "});// 401 unauthorized
            }
            client.close();
        }
        catch(error){
            console.log(error);
            client.close();
        }
    }else{

        res.sendStatus(500);
    }
})

app.listen(port,()=>{console.log("App Started",port)})

