
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.js";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            index: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avtar: {
            type: String,
            required: true
        },

        coverImage: {
            type: String
        },

        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],

        password: {
            type: String,
            required: [true, "Password is required"]
        },

        refreshToken: {
            type: String
        }
    },
    { timestamps: true }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    console.log("ACCESS_TOKEN_EXPIRY:", process.env.ACCESS_TOKEN_EXPIRY);
    try {
        return jwt.sign(
            {
                _id: this._id,
                email: this.email,
                username: this.username,
                fullName: this.fullName

            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )
    } catch (error) {
        console.error("Error generating access token:", error);
        throw new ApiError(500, "Failed to generate access token");
    }

}
userSchema.methods.generateRefreshAccessToken = function () {
    try {
        return jwt.sign(
            {
                _id: this._id,

            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
    } catch (error) {
        console.error("Error generating refresh token:", error);
        throw new ApiError(500, "Failed to generate refresh token");
    }

}

export const User = mongoose.model("User", userSchema)