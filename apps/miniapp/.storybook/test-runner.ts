import type { TestRunnerConfig } from "@storybook/test-runner";

const config: TestRunnerConfig = {
  tags: {
    include: ["contract-test"],
  },
  logLevel: "warn",
};

export default config;
