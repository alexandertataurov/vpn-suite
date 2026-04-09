/** @type {import('@storybook/test-runner').TestRunnerConfig} */
const config = {
  tags: {
    include: ["smoke"],
    exclude: ["no-tests"],
  },
};

module.exports = config;
