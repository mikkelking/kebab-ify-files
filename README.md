# Kebab-ify

A Command line utility to change React project filenames from PascalCase to kebab-case

## Why?

There is a tendency for people writing React code to name their files like the component names, eg `MyWidget` lives in a file called `MyWidget.js`

This is all very well until a file is saved and committed with a lower case name, such as `myWidget.js`. You rename the file on your Mac, and it all works well until you run on a Linux machine with a case-sensitive file system (MacOS appears to be, but it's not. It thinks `myWidget.js` and `MyWidget.js` are the same file.)

## What it does

It goes through your source files, issuing git commands to rename the files. Examples of renames are:

`src/Components/MyWidget/MyWidget.js` becomes `src/components/my-widget/my-widget.js`

Note that folder names are made lower case as well.

It also looks inside the files and looks for import statements like this:

`import MyWidget from '../../MyWidget/MyWidget';`

It will convert it to

`import MyWidget from '../../my-widget/my-widget';`

## Checking the results of the renaming

Kebabify assumes you are using git for source code control. You should make sure your repo is clean before you start.

Git commands are issued immediately and files modified. You can use `git status` to check what it did before you commit it. You should run your tests, and give your app a manual shakedown before committing and pushing these changes.

## Getting started

```
npm install -g kebab-ify
cd /path/to/your/project
kekab-ify
```
