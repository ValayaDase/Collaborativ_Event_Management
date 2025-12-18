import express from "express"
import {Message} from "../models/Message.js"
import {auth} from "../middleware/auth.js"
import { getIO } from "../socket.js";


const router = express.Router()

router.get("/:eventId",auth,async(req,res)=>{
    try{
        const {eventId} = req.params
        const messages = await Message.find({eventId})
        .populate("sender","username _id")
        .sort({createdAt:1}) 

        res.json({success:true,messages})
    }
    catch(err){
        res.json({success:false,error:err.message})
    }
})

router.post("/:eventId",auth,async(req,res)=>{
    try{
        const {eventId} = req.params
        const {text} = req.body
        const sender = req.userId

        const message = await Message.create({eventId,sender,text});
        const populated = await Message.findById(message._id).populate("sender","username _id")
        .populate("sender","username _id");

        const io = getIO();
        io.to(eventId).emit("new-message",populated);
        res.json({success:true,message:populated});
    }
    catch(err){
        res.json({success:false,error:err.message});
    }
})
export default router;