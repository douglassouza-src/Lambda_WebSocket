
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';

export async function handler(event: APIGatewayProxyEvent, context: Context) : Promise<APIGatewayProxyResult> {
    console.log(`Event: ${JSON.stringify(event)}`);
    
    return {
        statusCode: 200,
        body: "OK"
    }
}