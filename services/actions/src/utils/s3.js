import {
  CreateBucketCommand,
  GetObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import logger from "./logger.js";

const {
  AWS_S3_ENDPOINT,
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_SECRET_ACCESS_KEY,
  AWS_S3_REGION,
  MINIO_DEV_PROXY,
  NODE_ENV,
} = process.env;

const dev = NODE_ENV !== "production";

// 7 days
const AWS_S3_PRESIGNED_URL_EXPIRES_IN = 7 * 24 * 60 * 60;

const s3ClientConfig = {
  forcePathStyle: true,
  region: AWS_S3_REGION,
  credentials: {
    accessKeyId: AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
  },
};

if (AWS_S3_ENDPOINT) {
  s3ClientConfig.endpoint = AWS_S3_ENDPOINT;
}

const s3Client = new S3Client(s3ClientConfig);

export const findOrCreateBucket = async (bucketName) => {
  try {
    const listBucketsResult = await s3Client.send(new ListBucketsCommand({}));
    const buckets = listBucketsResult?.Buckets ?? [];

    const bucket = buckets.find((bucket) => bucket.Name === bucketName);

    if (!bucket) {
      const createBucketResult = await s3Client.send(
        new CreateBucketCommand({ Bucket: bucketName })
      );

      if (!createBucketResult?.Location) {
        throw new Error(`${bucketName} hasn't been created`);
      }
    }

    return {};
  } catch (error) {
    logger.error(`An error occured while working with the bucket: ${error}`);

    return { error };
  }
};

export const getPresignedDowloadUrl = async ({ bucketName, filePath }) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: filePath,
  });

  try {
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: AWS_S3_PRESIGNED_URL_EXPIRES_IN,
    });

    return { url };
  } catch (error) {
    logger.error(`An error occured while signing URL to the file: ${error}`);

    return { error };
  }
};

export const putFileToBucket = async ({
  bucketName,
  fileBody,
  filePath,
  fileContentType,
  fileContentLength,
}) => {
  const { error } = await findOrCreateBucket(bucketName);

  if (error) {
    return { error };
  }

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: filePath,
        Body: fileBody,
        ContentType: fileContentType,
        ContentLength: fileContentLength,
      })
    );
  } catch (error) {
    logger.error(`An error occured while working with the file: ${error}`);

    return { error };
  }

  const { url, error: presignError } = await getPresignedDowloadUrl({
    bucketName,
    filePath,
  });

  if (presignError) {
    return { error: presignError };
  }

  let resultUrl = url;
  if (dev) {
    resultUrl = resultUrl.replace(AWS_S3_ENDPOINT, MINIO_DEV_PROXY);
  }

  return { url: resultUrl };
};
