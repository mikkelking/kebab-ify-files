# Kebab-ify-files

A Command line utility to change React project filenames from PascalCase to kebab-case

## Why?

There is a tendency for people writing React code to name their files like the component names, eg `MyWidget` lives in a file called `MyWidget.js`.

While this may appear to be ok, there is a danger down the track, when you come to deploy to your Linux machine with a case-sensitive file system.

On your Mac (or PC), you can import a file with a slightly incorrect filename, like this:

```
import MyWidget from './myWidget'
```

Notice the `my` in `./myWidget`. This will work ok, but when you deploy, it will fail. These kinds of errors are difficult to find and fix, and you are usually under pressure to get things working, so are perhaps not as calm as you should be.

To avoid this problem, I like to make a rule that _ALL_ filenames are lower case, and use kebab-case, which makes it easy to read. You could use snake_case if you prefer that.

But, why is fixing filenames a problem? Well, here is the reason:

You rename the file on your Mac, and it has a different name, but because the Mac file system isn't properly case-sensitive, it is the same filename, and git doesn't see the change. So to fix that, you have to rename it twice, and you have to use git to do it, like this:

```
git mv src/Components src/components-temp
git mv src/components-temp src/components
```

It's a little easier when going to kebab-case, because only one rename is needed:

```
git mv src/components/MyWidget.js src/components/my-widgets.js
```

You'll notice that I renamed the folder as well as the files, all this becomes very tedious, which is why I did this in a script.

## What it does

It goes through your source files, issuing git commands to rename the files. Examples of renames are:

`src/Components/MyWidget/MyWidget.js` becomes `src/components/my-widget/my-widget.js`

Note that folder names are made lower case as well.

It also looks inside the files and looks for import statements like this:

`import MyWidget from '../../MyWidget/MyWidget';`

It will convert it to

`import MyWidget from '../../my-widget/my-widget';`

## Checking the results of the renaming

Kebabify assumes you are using git for source code control. You should make sure your repo is clean before you start. In fact, if git is being used, it won't do the changes unless the repo is clean.

Git commands are issued immediately and files modified. You can use `git status` to check what it did before you commit it. You should run your tests, and give your app a manual shakedown before committing and pushing these changes.

If you are not using git (I can't imagine why you would do that), then instead of issuing `git mv ...` commands, it just does `mv ...`. This way is somewhat risky. If your files are in a git repo and it all goes pear shaped, it's a simple operation to back track and undo all the changes.

## Getting started

```
cd /path/to/your/project
git checkout -b kebab-ify-files  # Create a new branch for this activity
npx kekab-ify-files src   # If no parameter specified, defaults to `src`
```

Review changes (eg with `git difftool`), make sure your tests still run...

```
git commit -am "Kebab-ify-files changes"
git push --set-upstream origin kebab-ify-files
```

Create a Pull Request and use github to review the changes.

### Logging

A list of all the git commands issued will be saved in `git-rename-commands.sh` and a log file `kebab-ify.log` lists the file/folder renames, and the list of modified files. Once you are happy with the results, you can safely remove the files. Git will keep a record of all of the changes anyway.

Here is a sample report:

```
Kebab-ification report
File/folder renames:
  * src/Components/ => src/components/
  * src/Components/MyWidget => src/components/my-widget
Files modified:
  * src/components/my-widget/my-widget.js
```

## Running the tests

Testing is quite simple atm. Feel free to add test cases, particularly if something is broken.

```
npm run test
```

## Deployment

No need, this is a dev time tool. You don't even need to add it to your project

## Contributing

Feel free to submit pull requests

## Authors

- **Mike King** - _Initial work_

## License

This project is licensed under the MIT License
