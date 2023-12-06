import child_process from "child_process";
import { readFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import {
  test,
  expect,
  afterAll,
  vi,
  describe,
  SpyInstance,
  afterEach,
  beforeAll,
} from "vitest";
import * as ex from "../../src/ex";
import { Simulator } from "../../src/simulator";
import { ApiAttributes } from "../../src/target-sim/schema-resources";
import { SimApp } from "../sim-app";

function getWebsiteUrl(s: Simulator, path: string): string {
  const apiAttrs = s.getResourceConfig(path).attrs as ApiAttributes;
  return apiAttrs.url;
}

function expectFirstArgToBe(fn: SpyInstance, firstArg: any) {
  const lastCall = fn.mock.lastCall;
  if (!lastCall) {
    throw new Error("function wasn't called");
  }
  expect(lastCall[0]).toBe(firstArg);
}

describe("Testing ReactApp", () => {
  const execMock = vi.spyOn(child_process, "exec");

  beforeAll(() => {
    mkdirSync(resolve(__dirname, `../test-files/react-website/public/`), {
      recursive: true,
    });
  });

  afterAll(() => {
    execMock.mockReset();
  });

  afterEach(() => {
    // const wingFile = resolve(
    //   __dirname,
    //   `../test-files/react-website/public/${ex.WING_JS}`
    // );
    // if (existsSync(wingFile)) {
    //   unlinkSync(wingFile);
    // }
  });

  test("website builds and serves static files", async () => {
    // GIVEN
    const app = new SimApp();
    new ex.ReactApp(app, "website", {
      projectPath: resolve(__dirname, "../test-files/react-website"),
      useBuildCommand: true,
    });

    // WHEN
    const s = await app.startSimulator();
    const websiteUrl = getWebsiteUrl(s, "/website");

    const indexPage = await fetch(websiteUrl);

    // THEN
    await s.stop();
    expect(await indexPage.text()).toEqual(
      readFileSync(
        resolve(__dirname, "../test-files/react-website/build/index.html"),
        {
          encoding: "utf-8",
        }
      )
    );

    expectFirstArgToBe(execMock, "npm run build");
  });

  test("adding an env var to the website ", async () => {
    // GIVEN
    const app = new SimApp();
    const website = new ex.ReactApp(app, "website", {
      projectPath: resolve(__dirname, "../test-files/react-website"),
      useBuildCommand: true,
    });

    website.addEnvironment("key", "value");

    // WHEN
    const s = await app.startSimulator();
    const websiteUrl = getWebsiteUrl(s, "/website");

    const indexPage = await fetch(websiteUrl);

    // THEN
    await s.stop();
    expect(await indexPage.text()).toEqual(
      readFileSync(
        resolve(__dirname, "../test-files/react-website/build/index.html"),
        {
          encoding: "utf-8",
        }
      )
    );

    expectFirstArgToBe(execMock, "npm run build");
  });

  test("running React App on dev mode", async () => {
    // GIVEN
    const app = new SimApp();
    new ex.ReactApp(app, "website", {
      projectPath: resolve(__dirname, "../test-files/react-website"),
    });

    // WHEN
    const s = await app.startSimulator();

    // THEN
    await s.stop();

    expectFirstArgToBe(execMock, "PORT=3001 npm run start");
  });

  test("running React App on dev mode on custom port", async () => {
    // GIVEN
    const app = new SimApp();
    new ex.ReactApp(app, "website", {
      projectPath: resolve(__dirname, "../test-files/react-website"),
      useBuildCommand: false,
      localPort: 4032,
    });

    // WHEN
    const s = await app.startSimulator();

    // THEN
    await s.stop();

    expectFirstArgToBe(execMock, "PORT=4032 npm run start");
  });

  test("running React App on dev mode with custom command", async () => {
    // GIVEN
    const CUSTOM_COMMAND = "echo 'custom command'";
    const app = new SimApp();
    new ex.ReactApp(app, "website", {
      projectPath: resolve(__dirname, "../test-files/react-website"),
      startCommand: CUSTOM_COMMAND,
      useBuildCommand: false,
    });

    // WHEN
    const s = await app.startSimulator();

    // THEN
    await s.stop();

    expectFirstArgToBe(execMock, `PORT=3001 ${CUSTOM_COMMAND}`);
  });

  test("running React App with custom command", async () => {
    // GIVEN
    const CUSTOM_COMMAND = "echo 'custom command'";
    const app = new SimApp();
    new ex.ReactApp(app, "website", {
      projectPath: resolve(__dirname, "../test-files/react-website"),
      buildCommand: CUSTOM_COMMAND,
      useBuildCommand: true,
    });

    // WHEN
    const s = await app.startSimulator();
    const websiteUrl = getWebsiteUrl(s, "/website");

    const indexPage = await fetch(websiteUrl);

    // THEN
    await s.stop();
    expect(await indexPage.text()).toEqual(
      readFileSync(
        resolve(__dirname, "../test-files/react-website/build/index.html"),
        {
          encoding: "utf-8",
        }
      )
    );

    expectFirstArgToBe(execMock, CUSTOM_COMMAND);
  });
});
