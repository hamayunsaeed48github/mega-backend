import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
    secure: true, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log("config", {
            cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
            api_key: `${process.env.CLOUDINARY_CLOUD_API_KEY}`,
            api_secret: `${process.env.CLOUDINARY_CLOUD_API_SECRET}`, // Click 'View API Keys' above to copy your API secret
        })
        if (!localFilePath) return null;
        // file upload'

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // upload file successfully on cloudinary
        console.log("File uploaded successfully", response.url);
        return response;
    } catch (error) {
        // remove the locally save temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath);
        console.log("error", error)

        return null;

    }


}


export { uploadOnCloudinary }