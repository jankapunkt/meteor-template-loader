/* eslint-env meteor */
Package.describe({
  name: 'jkuester:template-loader',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: 'The one and only template loader you need! Allows to import Templates dynamically at lookup-time.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/jankapunkt/meteor-template-loader',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom('1.6')
  api.use([
    'ecmascript',
    'blaze@2.0.0',
    'spacebars@1.0.0',
    'reactive-var'
  ], 'client')
  api.mainModule('template-loader.js', 'client')
})
