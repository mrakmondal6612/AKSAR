import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {Response} from "express"
import User from "../../models/User.model";
import jwt from "jsonwebtoken"

export async function handleChangeRoleRequestFunction(req: AuthenticatedRequest , res: Response){
    const userId = req.userId;
    const uniqueId = req.userUniqueId

    if(!userId){
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if(!uniqueId){
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { newRole } = req.body;

    if(newRole !== "INSTRUCTOR"){
        return res.status(400).json({ success: false, message: "Invalid role" });
    }

    try {
        const user = await User.findById(userId);

        if(user.role === "INSTRUCTOR" || user.role === "ADMIN" || user.role === "MASTER"){
            return res.status(400).json({success: false, message: "Role cannot be changed"});
        }

        user.role = newRole;
        await user.save();
        
        const token = jwt.sign(
            { id: user._id, role: user.role , uniqueId: user.uniqueId},
            process.env.JWT_SECRET!,
            {
              expiresIn: "15d",
            }
        );

        return res.status(200).json({success: true, message: "You are now an INSTRUCTOR", token});

    } catch (error){
        console.error("Change role error:", error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}