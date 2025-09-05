import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class MedicalOpinionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for file uploads
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `medical-opinion-uploads-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Lambda function for API
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset('../server'),
      environment: {
        UPLOADS_BUCKET: uploadsBucket.bucketName,
      },
    });

    // API Gateway
    const api = new apigateway.LambdaRestApi(this, 'MedicalOpinionApi', {
      handler: apiLambda,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Grant Lambda permissions to S3
    uploadsBucket.grantReadWrite(apiLambda);

    // Outputs
    new cdk.CfnOutput(this, 'ApiURL', {
      value: api.url,
    });
  }
}