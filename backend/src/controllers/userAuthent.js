// const redisClient = require("../config/redis");
// const User =  require("../models/user")
// const validate = require('../utils/validator');
// const bcrypt = require("bcrypt");
// const jwt = require('jsonwebtoken');
// const Submission = require("../models/submission")


// const register = async (req,res)=>{
    
//     try{
//         // validate the data;

//       validate(req.body); 
//       const {firstName, emailId, password}  = req.body;

//       req.body.password = await bcrypt.hash(password, 10);
//       req.body.role = 'user'
//     //
    
//      const user =  await User.create(req.body);


//      const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
//      const reply = {
//         firstName: user.firstName,
//         emailId: user.emailId,
//         _id: user._id,
//         role:user.role,
//     }
    
//      res.cookie('token',token,{maxAge: 60*60*1000});
//      res.status(201).json({
//         user:reply,
//         message:"Loggin Successfully"
//     })
//     }
//     catch(err){
//         res.status(400).send("Error: "+err);
//     }
// }


// const login = async (req,res)=>{

//     try{
//         const {emailId, password} = req.body;

//         if(!emailId)
//             throw new Error("Invalid Credentials");
//         if(!password)
//             throw new Error("Invalid Credentials");

//         const user = await User.findOne({emailId});

//         const match = await bcrypt.compare(password,user.password);

//         if(!match)
//             throw new Error("Invalid Credentials");

//         const reply = {
//             firstName: user.firstName,
//             emailId: user.emailId,
//             _id: user._id,
//             role:user.role,
//         }

//         const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
//         res.cookie('token',token,{maxAge: 60*60*1000});
//         res.status(201).json({
//             user:reply,
//             message:"Loggin Successfully"
//         })
//     }
//     catch(err){
//         res.status(401).send("Error: "+err);
//     }
// }


// // logOut feature

// const logout = async(req,res)=>{

//     try{
//         const {token} = req.cookies;
//         const payload = jwt.decode(token);


//         await redisClient.set(`token:${token}`,'Blocked');
//         await redisClient.expireAt(`token:${token}`,payload.exp);
//     //    Token add kar dung Redis ke blockList
//     //    Cookies ko clear kar dena.....

//     res.cookie("token",null,{expires: new Date(Date.now())});
//     res.send("Logged Out Succesfully");

//     }
//     catch(err){
//        res.status(503).send("Error: "+err);
//     }
// }


// const adminRegister = async(req,res)=>{
//     try{
//         // validate the data;
//     //   if(req.result.role!='admin')
//     //     throw new Error("Invalid Credentials");  
//       validate(req.body); 
//       const {firstName, emailId, password}  = req.body;

//       req.body.password = await bcrypt.hash(password, 10);
//     //
    
//      const user =  await User.create(req.body);
//      const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
//      res.cookie('token',token,{maxAge: 60*60*1000});
//      res.status(201).send("User Registered Successfully");
//     }
//     catch(err){
//         res.status(400).send("Error: "+err);
//     }
// }

// const deleteProfile = async(req,res)=>{
  
//     try{
//        const userId = req.result._id;
      
//     // userSchema delete
//     await User.findByIdAndDelete(userId);

//     // Submission se bhi delete karo...
    
//     // await Submission.deleteMany({userId});
    
//     res.status(200).send("Deleted Successfully");

//     }
//     catch(err){
      
//         res.status(500).send("Internal Server Error");
//     }
// }


// module.exports = {register, login,logout,adminRegister,deleteProfile};





const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission");
const cloudinary = require('cloudinary').v2;
const { getTransformedUrl } = require('../utils/cloudinaryHelper');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const DEFAULT_PROFILE_IMAGE = process.env.DEFAULT_PROFILE_IMAGE || 'default-profile-image-url';

const register = async (req, res) => {
  try {

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }

    validate(req.body);
    const { firstName, emailId, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with default profile image
    const user = await User.create({
      firstName,
      emailId,
      password: hashedPassword,
      role: 'user'
      // profileImage: {
      //   cloudinaryPublicId: 'default',
      //   secureUrl: DEFAULT_PROFILE_IMAGE,
      //   transformedUrl: DEFAULT_PROFILE_IMAGE
      // }
    });

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );

    // Set HTTP-only secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000,
      sameSite: 'strict'
    });

    // Return response with profile image
    res.status(201).json({
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role
        // profileImage: user.profileImage.transformedUrl
      },
      message: "Registration successful"
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    const statusCode = err.name === 'ValidationError' ? 400 : 500;
    res.status(statusCode).json({ error: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user with case-insensitive email
    const user = await User.findOne({ emailId: { $regex: new RegExp(`^${emailId}$`, 'i') } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );

    // Set HTTP-only secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000,
      sameSite: 'strict'
    });

    // Return response with profile image
    res.json({
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role
        // profileImage: user.profileImage.transformedUrl
      },
      message: "Login successful"
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Authentication failed" });
  }
};

const logout = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(400).json({ error: "No active session" });
        }

        // Add token to blocklist
        const payload = jwt.decode(token);
        await redisClient.set(`token:${token}`, 'blocked');
        await redisClient.expireAt(`token:${token}`, payload.exp);

        // Clear cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.json({ message: "Logout successful" });
    } catch (err) {
        console.error("Logout error:", err.message);
        res.status(500).json({ error: "Logout failed" });
    }
};

const adminRegister = async (req, res) => {
    try {
        validate(req.body);
        const { firstName, emailId, password } = req.body;

        // Check for existing admin
        const existingAdmin = await User.findOne({ emailId, role: 'admin' });
        if (existingAdmin) {
            return res.status(409).json({ error: "Admin already exists" });
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await User.create({
            firstName,
            emailId,
            password: hashedPassword,
            role: 'admin'
        });

        res.status(201).json({
            message: "Admin registration successful",
            adminId: admin._id
        });
    } catch (err) {
        console.error("Admin registration error:", err.message);
        const statusCode = err.name === 'ValidationError' ? 400 : 500;
        res.status(statusCode).json({ error: "Admin registration failed" });
    }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // // Delete profile image if exists and not default
    // if (user.profileImage?.cloudinaryPublicId && 
    //     user.profileImage.cloudinaryPublicId !== 'default') {
    //   try {
    //     await cloudinary.uploader.destroy(
    //       user.profileImage.cloudinaryPublicId,
    //       { resource_type: 'image' }
    //     );
    //   } catch (cloudErr) {
    //     console.error("Cloudinary delete error:", cloudErr.message);
    //   }
    // }

    // Delete user and associated data
    await User.findByIdAndDelete(userId);
    await Submission.deleteMany({ userId });

    // Clear authentication cookie
    res.clearCookie('token');

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Account deletion error:", err.message);
    res.status(500).json({ error: "Account deletion failed" });
  }
};

// Other functions (logout, adminRegister) remain unchanged

module.exports = { register, login, logout, adminRegister, deleteProfile };