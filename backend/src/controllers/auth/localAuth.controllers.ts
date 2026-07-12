import { Request, Response } from "express";
import User, { IUser } from "../../models/User.model"
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { checkConstraints, checkLoginConstraintsAsEmail, checkLoginConstraintsAsUserName, returnIdentity } from "../../validchecks/checkAuthConstraints";
import { emailVerificationAlert, sendEmailVerification } from "../../helpers/mailer";

export async function handleSignUpFunction(req: Request, res: Response) {
    try {
      const { 
        userName, 
        firstName, 
        lastName, 
        email, 
        password,
        userDob,
        bio,
        address,
        phoneNumber,
        interests,
        interestTags,
        learningGoal,
        experienceLevel
      } = req.body;
  
      if (!userName || !firstName || !email || !password || !lastName) {
        return res
          .status(400)
          .json({ success: false, message: "Please filled all the required fields" });
      }
  
      const isValid = checkConstraints(
        userName,
        firstName,
        lastName,
        email,
        password
      );
      if (!isValid) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Constraints" });
      }
  
      const user = await User.findOne({ email: email });
  
      if (user && user.emailVerificationStatus === true) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }
  
      const username = await User.findOne({ userName: userName });
      if (username && username.emailVerificationStatus && (!user || user._id.toString() !== username._id.toString())) {
        return res
          .status(400)
          .json({ success: false, message: "User Name already taken" });
      }
      
      const hashedPassword: string = await bcrypt.hash(password, 10);
      
      const { nanoid } = await import('nanoid');
 
      let referredByUniqueId = "";
      if (req.body.referralCode) {
        const referrer = await User.findOne({ userName: req.body.referralCode });
        if (referrer) {
          referredByUniqueId = referrer.uniqueId;
        }
      }
      
      let userId;
      if (user) {
        // Update existing unverified user
        user.userName = userName;
        user.firstName = firstName;
        user.lastName = lastName;
        user.password = hashedPassword;
        user.bio = bio || "Hey, I am using AKSAR";
        if (userDob) user.userDob = userDob;
        if (address) user.address = address;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (interests) user.interests = interests;
        if (interestTags) user.interestTags = interestTags;
        if (learningGoal) user.learningGoal = learningGoal;
        if (experienceLevel) user.experienceLevel = experienceLevel;
        user.referredBy = referredByUniqueId;
        user.referralCode = userName;
        
        await user.save();
        userId = user._id;
      } else {
        // Create new user
        const newUser = new User({
          uniqueId: nanoid(),
          userName: userName,
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPassword,
          role: "STUDENT",
          bio: bio || "Hey, I am using AKSAR",
          userDob: userDob,
          address: address,
          phoneNumber: phoneNumber,
          interests: interests || [],
          interestTags: interestTags || [],
          learningGoal: learningGoal,
          experienceLevel: experienceLevel,
          referredBy: referredByUniqueId,
          referralCode: userName,
        });
        await newUser.save();
        userId = newUser._id;
      }
  
      await sendEmailVerification(email, userId as any);
  
      return res.status(201).json({
        success: true,
        message: "signed up successfully, please verify your email",
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
  
  export async function handleLoginFunction(req: Request, res: Response) {
    try {
      const { identity, password } = req.body;
  
      if (!identity || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Please fill all the fields" });
      }
  
      let userIdentity: null | string = null;
      const returnedIdentity = returnIdentity(identity);
  
      if (returnedIdentity === "userName") {
        const isValidConstraintsAsUserName = checkLoginConstraintsAsUserName(
          identity,
          password
        );
        if (!isValidConstraintsAsUserName) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid username or password" });
        }
  
        userIdentity = identity;
      } else if (returnedIdentity === "email") {
        const isValidConstraintsAsEmail = checkLoginConstraintsAsEmail(
          identity,
          password
        );
        if (!isValidConstraintsAsEmail) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid email or password" });
        }
  
        userIdentity = identity;
      }
  
      const user = await User.findOne({
        $or: [{ userName: userIdentity }, { email: userIdentity }],
      });
  
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect password" });
      }
  
      const token = jwt.sign(
        { id: user._id, role: user.role , uniqueId: user.uniqueId},
        process.env.JWT_SECRET!,
        {
          expiresIn: "15d",
        }
      );
  
      return res
        .status(200)
        .json({ success: true, message: "Login successful", token });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
  