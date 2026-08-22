const cloudinary = require('cloudinary').v2;
const config = require('../config');

// Initialize Cloudinary with server-side credentials
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

class CloudinaryService {
  /**
   * Upload an image from a remote URL to Cloudinary CDN
   * @param {string} imageUrl Source image URL (e.g. from Pexels)
   * @param {string} folder Target Cloudinary folder path
   * @param {string} publicId Optional custom public_id for caching/uniqueness
   * @returns {Promise<string|null>} Cloudinary CDN secure URL or null if upload fails
   */
  async uploadFromUrl(imageUrl, folder = 'pathpilot/destinations', publicId = null) {
    if (!imageUrl) return null;

    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      console.warn('Cloudinary credentials are not configured.');
      return null;
    }

    try {
      const options = {
        folder,
        overwrite: false,
        resource_type: 'image'
      };

      if (publicId) {
        options.public_id = publicId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      }

      const result = await cloudinary.uploader.upload(imageUrl, options);
      return result.secure_url || result.url || null;
    } catch (error) {
      console.warn(`Cloudinary upload failed for ${imageUrl}:`, error.message || error);
      return null;
    }
  }
}

module.exports = new CloudinaryService();
