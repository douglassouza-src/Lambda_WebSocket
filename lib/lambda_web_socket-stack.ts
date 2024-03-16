import * as cdk from 'aws-cdk-lib';
import * as sqs from  'aws-cdk-lib/aws-sqs';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

import { Construct } from 'constructs';

export class LambdaWebSocketStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionHandler = new lambdaNodeJs.NodejsFunction(this, 'ConnectionHandler', {
      functionName: 'ConnectionHandler',
      entry: 'lambda/connectionFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false
      }
    })

    const disconnectionHandler = new lambdaNodeJs.NodejsFunction(this, 'DisconnectionHandler', {
      functionName: 'DisconnectionHandler',
      entry: 'lambda/disconnectionFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false
      }
    })

    const websocketApi = new apigatewayv2.WebSocketApi(this, "WSApi", {
      apiName: "WSApi",
      connectRouteOptions: {
        integration: new apigatewayv2_integrations.WebSocketLambdaIntegration("ConnectionHandler", connectionHandler)
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2_integrations.WebSocketLambdaIntegration("DisconnectionHandler", disconnectionHandler)
      }
    })

    const stage = "prod"
    const wsApiEndpoint = `${websocketApi.apiEndpoint}/${stage}`
    new apigatewayv2.WebSocketStage(this, 'WSApistage', {
      webSocketApi: websocketApi,
      stageName: stage,
      autoDeploy: true
    })

    const receiverHandler = new lambdaNodeJs.NodejsFunction(this, 'ReceiverHandler', {
      functionName: 'ReceiverHandler',
      entry: 'lambda/receiverFunction.ts',
      handler: 'handler',
      memorySize: 128,
      timeout: cdk.Duration.seconds(2),
      bundling: {
        minify: true,
        sourceMap: false
      },
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        WSAPI_ENDPOINT: wsApiEndpoint
      }
    })
    websocketApi.grantManageConnections(receiverHandler)

    websocketApi.addRoute('action1', {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration("ReceiverHandler", receiverHandler)
    })

  }
}
