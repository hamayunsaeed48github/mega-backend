import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessTokenAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshAccessToken()

        console.log("accessToken", accessToken)

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "Something went wrong while access token aur refresh token is generated")
    }
}

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
        new ApiResponse("User Register successfully", createdUser, 200)
    )




});

const loginUser = asyncHandler(async (req, res) => {
    // reqbody sy data lana hai
    // phir humne username or email check krwana hai
    // phir humen user ko find krna hai
    // phir humne password check krwnana hai 
    // phir hume access token or refresh token generate krwa k user ko bjhne hai

    const { email, username, password } = req.body;
    console.log("email", email)

    if (!email && !username) {
        throw new ApiError(400, "userName or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordIsValid = await user.isPasswordCorrect(password)

    if (!isPasswordIsValid) {
        throw new ApiError(401, "Invalid credentials")
    }
    //console.log(generateAccessTokenAndRefreshToken(user._id))

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)
    console.log(accessToken)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                "UserLoggedIn Successfull",
                {
                    loggedInUser, accessToken, refreshToken
                },
                200
            )
        )



})

const loggedOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }

        },
        {
            new: true
        }
    )
    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse("User Logged out", {}, 200))
})

const AccessRefreshToken = asyncHandler(async (req, res) => {
    const incomintRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomintRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomintRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomintRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")

        }

        const option = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id)

        return res
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", newRefreshToken, option)
            .json(
                new ApiResponse(200, { accessToken, newRefreshToken }, "Access Token refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }


})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Your old password is invalid")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(
            "your password is changed", {}, 200
        ))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            "CurrentUser fetch successfully",
            req.user,
            200
        ))
})

const updateCurrentAccount = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "Both feilds are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            "Account Detail update successfully",
            user,
            200
        ))

})

const updateUserAvtar = asyncHandler(async (req, res) => {
    const localAvtarPath = req.file?.path

    if (!localAvtarPath) {
        throw new ApiError(400, "Avtar path is missing")
    }

    const avtar = await uploadOnCloudinary(localAvtarPath)

    if (!avtar.url) {
        throw new ApiError(400, "Avtar url is missing")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avtar: avtar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            "AvtarImage update successfully",
            user,
            200
        ))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const localCoverPath = req.file?.path

    if (!localCoverPath) {
        throw new ApiError(400, "CoverImage path is missing")
    }

    const coverImage = await uploadOnCloudinary(localCoverPath)

    if (!coverImage.url) {
        throw new ApiError(400, "CoverImage url is missing")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            "CoverImage update successfully",
            user,
            200
        ))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }

        },
        {
            $addFields: {
                subscribedCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribedCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avtar: 1,
                coverImage: 1,
                email: 1



            }
        }
    ])
    console.log("Channel is :", channel)

    if (!channel?.length) {
        throw new ApiError(400, "Channel length is missing")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            channel[0],
            "Channel fetch successfully"
        ))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avtar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(
            "Watch history fetch successfully",
            user[0].watchHistory,
            200
        ))
})

export {
    registerUser,
    loginUser,
    loggedOutUser,
    AccessRefreshToken,
    changeCurrentPassword,
    getCurrentUser,
    updateCurrentAccount,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}