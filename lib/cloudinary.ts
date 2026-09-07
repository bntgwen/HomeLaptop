import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

/**
 * Upload single/multiple file buffer to Cloudinary
 */
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  folder = 'ukk-app'
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Upload to Cloudinary failed'))
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          })
        }
      )
      .end(fileBuffer)
  })
}
