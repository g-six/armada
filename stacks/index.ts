import { App } from "@serverless-stack/resources";
import { ApiAuthStack } from "./ApiAuthStack";

export default function (app: App) {
  app.setDefaultFunctionProps({
    runtime: "nodejs16.x",
    srcPath: "src",
    bundle: {
      format: "esm",
    },
  });

  app.stack(ApiAuthStack)
}
