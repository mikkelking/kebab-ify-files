#!/usr/bin/env node

const recursive = require('recursive-readdir')
const chalk = require('chalk')
const gitStatus = require('git-status')
const fs = require('fs')
const { execFileSync } = require('child_process')

const camelCaseToKebab = myStr => {
  newStr = myStr.replace(/\s+/g, '-') // Replace spaces because we don't like them
  return newStr.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

const splitpath = filepath => {
  const parts = filepath.split(/\//)
  const file = parts.pop()
  const path = parts.join('/')
  return [path, file]
}

const fixpath = p => {
  const [path, file] = splitpath(p)
  return `${path.toLowerCase()}/${file}`
}

const ABORT = msg => {
  const BANG = '\n * * * * * * * FAILED * * * * * * * * *\n\n'
  console.error(BANG + msg + '\n' + BANG)
  process.exit(1)
}
const skipThese = ['setupTests.*']

//
// Main line starts here
//
const paths = {}
const opts = {
  git: true
}
const fixedfiles = []
// Path renames we did already

const gitcommands = ['#!/bin/bash']

const reg = new RegExp(/(import\s+|from\s+|require\()['"](.*)['"]/)

const [, , ...args] = process.argv
const target = args[0] || 'src'
if (!fs.existsSync(target)) {
  console.error(
    `Directory ${chalk.bgRed.yellow.underline(target)} does not exist`
  )
  process.exit(1)
}

// Check on git status - can't proceed if we are dirty

gitStatus((err, data) => {
  if (err) {
    if (err.match(/not a git repository/i)) {
      opts.git = false
    } else {
      ABORT(err)
    }
  }
  // data contains an array of dirty files, we worry about Modified files only
  // [ { x: ' ', y: 'M', to: 'example/index.js', from: null } ]
  const dirty = []
  if (data) {
    data.forEach(row => {
      if (row.from || row.y === 'M') {
        dirty.push(row.to)
      }
    })
  }
  if (dirty.length) {
    ABORT(
      'Git is showing ' +
        dirty.length +
        ' dirty files, (' +
        dirty.join(', ') +
        ') please fix and retry'
    )
  }
  // Good to go...
  pass1()
})

const pass1 = () => {
  recursive(target, skipThese, function(err, files) {
    // `files` is an array of file paths
    files.forEach(filename => {
      const [path, file] = splitpath(filename)
      const dirs = path.split('/')
      dirs.pop() // Lose the last one
      let tp = ''
      dirs.forEach(dir => {
        tp = `${tp}${dir}/`
        if (dir.match(/[A-Z]/)) {
          const trimtp = tp.replace(/\/$/, '')
          if (!paths[trimtp]) {
            paths[trimtp] = trimtp.toLowerCase()
            gitcommands.push(`mv '${trimtp}' '${trimtp.toLowerCase()}'`)
          }
        }
      })
      const newpath = camelCaseToKebab(path)
      console.log(`[${path}] [${newpath}]`)
      if (path !== newpath && !paths[path]) {
        paths[path] = newpath
        if (!newpath.match(/\-/)) {
          const tmppath = `${newpath}.temp-rename`
          gitcommands.push(`mv '${fixpath(path)}' '${tmppath}'`)
          gitcommands.push(`mv '${tmppath}' '${newpath}'`)
        } else {
          gitcommands.push(`mv '${fixpath(path)}' '${newpath}'`)
        }
      }

      const newfile = camelCaseToKebab(file)
      if (file !== newfile) {
        if (!newfile.match(/\-/)) {
          const tmpfile = `${newfile}.temp-rename`
          gitcommands.push(`mv '${newpath}/${file}' '${newpath}/${tmpfile}'`)
          gitcommands.push(`mv '${newpath}/${tmpfile}' '${newpath}/${newfile}'`)
        } else {
          gitcommands.push(`mv '${newpath}/${file}' '${newpath}/${newfile}'`)
        }
      }
    })
    //
    // Do the first stage, rename the files
    //

    const cmdfile = `${process.cwd()}/git-rename-commands.sh`

    // If there were any files or folders to rename, do it now

    if (gitcommands.length > 1) {
      fs.writeFileSync(
        cmdfile,
        gitcommands
          .map(cmd => {
            return opts.git ? `git ${cmd}` : cmd
          })
          .join('\n'),
        {
          encoding: 'utf8',
          mode: 0o766
        }
      )
      const res = execFileSync(cmdfile, { cwd: process.cwd() })
    } else {
      console.error('No files or folders to rename')
      process.exit(1)
    }

    //
    // Make another pass, modifying the imports statements in each file
    // according to the same renaming logic
    //
    recursive(target, skipThese, function(err, srcfiles) {
      // `srcfiles` is an array of file paths
      srcfiles.forEach(f => {
        const lines = fs.readFileSync(f, 'utf8').split(/\n/)
        let dirty = false
        const newbuf = lines
          .map(line => {
            let newline = line
            const m = line.match(reg)
            if (m) {
              const newfile = camelCaseToKebab(m[2])
              if (m[1] !== newfile) {
                newline = line.replace(reg, `${m[1]}'${newfile}'`)
                dirty = true
              }
            }
            return newline
          })
          .join('\n')
        if (dirty) {
          fixedfiles.push(f)
          fs.writeFileSync(f, newbuf)
        }
      })
      //
      // Now is the moment to report on what we did
      //
      const reportfile = 'kebab-ify.log'
      const contents = `Kebab-ification report
File/folder renames:
${
  Object.keys(paths).length
    ? Object.keys(paths)
        .map(p => `  * ${p} => ${paths[p]}`)
        .join('\n')
    : '(None)'
}
Files modified:
${
  fixedfiles.length ? `${fixedfiles.map(f => `  * ${f}`).join('\n')}` : '(None)'
}
      `
      fs.writeFileSync(reportfile, contents)
      console.log(chalk.bgGreen.black('  Done  '))
    })
  })
}
