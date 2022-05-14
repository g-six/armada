import { StackContext, Api } from "@serverless-stack/resources";

export function MyStack({ stack }: StackContext) {
  const api = new Api(stack, "api", {
    routes: {
      "GET /": "functions/lambda.handler",
    },
  });

  // Show the API endpoint in the output
  this.addOutputs({
    ApiEndpoint: api.url,
  })
}
