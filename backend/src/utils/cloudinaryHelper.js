const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function getTransformedProfileImageUrl(publicId) {
  return publicId === 'default' 
    ? process.env.DEFAULT_PROFILE_IMAGE
    : cloudinary.url(publicId, {
        width: 25,
        height: 25,
        crop: 'fill',
        secure: true,
        quality: 'auto:best'
      });
}

module.exports = { getTransformedProfileImageUrl };