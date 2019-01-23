#!/usr/bin/env node

const fs = require("fs");
const mkpath = require("mkpath");
const { execSync } = require("child_process");

// base is defined as a location outside a git repo. Assumes I have write
// access to .. :)
const base = "../.kebab-ify-test";
const widgetContents = `
//# 
//# Test file
//#
import Avatar from '../../Components/Avatar'
import SomeThing from '../../Components/SomeThing'
import SomeThingElse from '../../components/SomeThingElse'
//
// The rest of the file isn't important
//
`;
const avatarContents = `
//# 
//# Avatar component test file
//#
import SomeThing from '../../components/SomeThing'
//
// The rest of the file isn't important
//
`;

afterAll(() => {
  execSync(`rm -rf ${base}`);
});

//
// Defensive cleanup of old test folder
//
if (fs.existsSync(base)) {
  execSync(`rm -rf ${base}/*`);
}
mkpath.sync(`${base}/src/Components/MyWidget`);
const widgetsrc = `${base}/src/Components/MyWidget/MyWidget.js`;
fs.writeFileSync(widgetsrc, widgetContents, {
  encoding: "utf8"
});
const avatarsrc = `${base}/src/Components/Avatar.js`;
fs.writeFileSync(avatarsrc, avatarContents, {
  encoding: "utf8"
});
const setupTestsFile = `${base}/src/setupTests.ts`;
fs.writeFileSync(setupTestsFile, "Contents not important", {
  encoding: "utf8"
});

test("Files are set up", async () => {
  await expect(fs.existsSync(base)).toBeTruthy();
  await expect(fs.existsSync(widgetsrc)).toBeTruthy();
});

test("Kebab-ify!!!", () => {
  expect(execSync("kebab-ify src", { cwd: base })).toBeTruthy();
});

test("PascalCase files are not there any more", () => {
  expect(fs.existsSync(base)).toBeTruthy();
  // Because MacOS isn't case sensitive, this folder appears to be there, even though it
  // has been renamed, so we can't do this test
  // expect(fs.existsSync(`${base}/src/Components`)).toBeFalsy()
  expect(fs.existsSync(`${base}/src/Components/MyWidget`)).toBeFalsy();
  expect(
    fs.existsSync(`${base}/src/Components/MyWidget/MyWidget.js`)
  ).toBeFalsy();
});

test("kebab-case files are there", () => {
  expect(fs.existsSync(base)).toBeTruthy();
  expect(fs.existsSync(`${base}/src/components`)).toBeTruthy();
  expect(
    fs.existsSync(`${base}/src/components/my-widget/my-widget.js`)
  ).toBeTruthy();
});

test("setupTests file is preserved", async () => {
  await expect(fs.existsSync(setupTestsFile)).toBeTruthy();
});
