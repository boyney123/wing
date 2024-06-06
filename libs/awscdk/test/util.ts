import { Template } from "aws-cdk-lib/assertions";
import { App, CdkAppProps, Platform } from "../src";
import { PolyconFactory } from "@winglang/sdk/lib/core";
import { mkdtemp } from "@winglang/sdk/test/util";

export interface AwsCdkAppProps extends Partial<CdkAppProps> {}

export class AwsCdkApp extends App {
  constructor(props: AwsCdkAppProps = {}) {
    const platform = new Platform();
    const polyconFactory = new PolyconFactory(
      [platform.newInstance.bind(platform)],
      [platform.typeForFqn.bind(platform)]
    );

    super({
      outdir: mkdtemp(),
      entrypointDir: __dirname,
      isTestEnvironment: false,
      rootConstruct: undefined,
      polyconFactory,
      stackName: "my-project",
      ...props,
    });
  }
}

/**
 * Sanitize the text of a code bundle to remove path references that are system-specific.
 */
export function sanitizeCode(code: string): string {
  function removeAbsolutePaths(text: string) {
    const regex = /"[^"]+?\/libs\/awscdk\/(.+?)"/g;

    // replace first group with static text
    return text.replace(regex, '"[REDACTED]/awscdk/$1"');
  }

  return removeAbsolutePaths(code);
}

export function awscdkSanitize(template: Template): any {
  let json = template.toJSON();

  let jsonString = JSON.stringify(json, (key, value) => {
    if (key === "S3Key" && value.endsWith(".zip")) {
      return "<S3Key>";
    }

    return value;
  });

  jsonString = jsonString.replace(
    /CurrentVersion.+?"/g,
    'CurrentVersion<GUID>"'
  );

  return JSON.parse(jsonString);
}
