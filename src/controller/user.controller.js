import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // step we follow to register a user

    // get user details from frontend
    // validation
    // check user account already exist or no by using email aur username
    //check for image,check for avtar
    // upload them to cloudinary
    // create user object entry in db
    // remove user password and refresh token from response 
    // return response


    const { fullName, email, username, password } = req.body
    console.log("email", email);

    if (
        [fullName, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    );

    if (existedUser) {
        throw new ApiError(409, "User with this email or username is already exists")
    }

    const avtarLocalPath = req.files?.avtar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path

    console.log("Avtar Path:", avtarLocalPath);
    //console.log("Cover Image Path:", coverImageLocalPath)
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log(avtarLocalPath)
    if (!avtarLocalPath) {
        throw new ApiError(400, "Avtar is required")
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log(avtar)

    if (!avtar) {
        throw new ApiError(400, "Avtar is required")

    }


    const user = await User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Error while registering")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Register successfully")
    )




})

export { registerUser }