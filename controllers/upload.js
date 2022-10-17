const AWS = require("aws-sdk")
const { orderBy } = require("lodash")


// const s3Credentials = new AWS.Credentials({
//   accessKeyId: "AKIAU3KZNLVGIT45XUV2",
//   secretAccessKey: "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",
// })

const s3 = new AWS.S3({
  region: "ca-central-1",
  // credentials: s3Credentials,
  apiVersion: '2006-03-01', signatureVersion: 'v4'
})

const BUCKET_NAME = "gamestrat-capstone-videos"

const UploadController = {
  initializeMultipartUpload: async (req, res) => {
    const { name } = req.body

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: `${name}`,

    }

    const multipartUpload = await s3.createMultipartUpload(multipartParams).promise()

    res.send({
      fileId: multipartUpload.UploadId,
      fileKey: multipartUpload.Key,
    })
  },

  getMultipartPreSignedUrls: async (req, res) => {
    const { fileKey, fileId, parts } = req.body

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: fileId,

    }

    const promises = []

    for (let index = 0; index < parts; index++) {
      promises.push(
        s3.getSignedUrlPromise("uploadPart", {
          ...multipartParams,
          PartNumber: index + 1,
        }),
      )
    }

    const signedUrls = await Promise.all(promises)

    const partSignedUrlList = signedUrls.map((signedUrl, index) => {
      return {
        signedUrl: signedUrl,
        PartNumber: index + 1,
      }
    })

    res.send({
      parts: partSignedUrlList,
    })
  },

  finalizeMultipartUpload: async (req, res) => {
    const { fileId, fileKey, parts } = req.body

    const multipartParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: fileId,
      MultipartUpload: {
        // ordering the parts to make sure they are in the right order
        Parts: orderBy(parts, ["PartNumber"], ["asc"]),
      },
    }

    await s3.completeMultipartUpload(multipartParams).promise()

    res.send()
  },
}

module.exports = { UploadController }
