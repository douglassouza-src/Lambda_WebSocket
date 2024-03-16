import { APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';
import * as AWSRay from 'aws-xray-sdk';
import { v4 as uuid } from 'uuid';

AWSRay.captureAWS(require('aws-sdk'))

const wsApiEndpoint = process.env.WSAPI_ENDPOINT!.substring(6)

const apiGatewayManagementApi = new ApiGatewayManagementApi({
    endpoint: wsApiEndpoint
})

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    console.log(`Event: ${JSON.stringify(event)}`);
    
    const lambdaRequestId = context.awsRequestId
    const connectionId = event.requestContext.connectionId!
    const email = JSON.parse(event.body!).email as string

    console.log(`Email: ${email} = ConnectionId: ${connectionId} - Lambda requestId: ${lambdaRequestId}`);
    
    const transactionId = uuid()

    const postData = JSON.stringify({
        email: email,
        transactionId: transactionId,
        status: "RECEIVED"
    })

    await apiGatewayManagementApi.postToConnection({
        ConnectionId: connectionId,
        Data: postData
    }).promise()
    
    return {
        statusCode: 200,
        body: "OK"
    }
    
};