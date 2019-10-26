const fs = require('fs');
const streamifier = require('streamifier');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;
const azure = require("@azure/storage-blob");
const {
  Aborter,
  BlobURL,
  BlockBlobURL,
  ContainerURL,
  ServiceURL,
  StorageURL,
  SharedKeyCredential
} = azure;

const fetch = require('node-fetch');

const sharedKeyCredential = new SharedKeyCredential(apiKeys.azureBlob.account, apiKeys.azureBlob.accountKey);
const pipeline = StorageURL.newPipeline(sharedKeyCredential);
const serviceURL = new ServiceURL(
  `https://${apiKeys.azureBlob.account}.blob.core.windows.net`,
  pipeline
);
const containerURL = ContainerURL.fromServiceURL(serviceURL, "images");

/**
 * Uploads an image into azure blob storage with the specified name
 * @param {Buffer} imageData 
 * @param {string} name 
 * @returns {Promise<string>} A new URL pointing to the image in blob storage
 */
async function uploadImage(imageData, name) {
  let stream = streamifier.createReadStream(imageData);

  const blobURL = BlobURL.fromContainerURL(containerURL, name);
  const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);
  let uploadBlobResponse = await azure.uploadStreamToBlockBlob(Aborter.none, stream, blockBlobURL, imageData.byteLength, 1);
  return blockBlobURL.url;
}

module.exports = {
  /**
   * Copies a public image from URL into azure blob storage with the specified name
   * @param {string} publicURL 
   * @param {string} name 
   * @returns {string} A new URL pointing to the image in blob storage
   */
  uploadImageFromURL: async function(publicURL, name) {
    let d = await fetch(publicURL);
    let buf = await d.buffer();
    return (await uploadImage(buf, name));
  },
  /**
   * Uploads an image into azure blob storage with the specified name
   * @param {Buffer} imageData 
   * @param {string} name 
   * @returns {Promise<string>} A new URL pointing to the image in blob storage
   */
  uploadImage: async function(imageData, name) {
    return (await uploadImage(imageData, name));
  },
  deleteImage: async function(name) {
    let blobURL = BlobURL.fromContainerURL(containerURL, name);
    let bbURL = BlockBlobURL.fromBlobURL();
    return await bbURL.delete();
  }
}
