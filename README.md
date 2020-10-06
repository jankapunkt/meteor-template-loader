# Meteor Template Loader

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![GitHub file size in bytes](https://img.shields.io/github/size/jankapunkt/meteor-template-loader/template-loader.js)
![GitHub](https://img.shields.io/github/license/jankapunkt/meteor-template-loader)


The one and only template loader you need! 
Allows to import Templates dynamically at lookup-time.
All code < 200 lines.


## How it works

Blaze usually requires a Template to exist when looking it up to render it's
content to the DOM. However, a `Blaze.View` is constructed reactively, waiting for the template
instance to be created, first. 

This mechanism can be exploited in order to "wait" until the Template
is imported and from there run like with any other Template.

## Installation and usage

Install this package via

```bash
$ meteor add jkuester:template-loader
```

Then import it anywhere soon in your client startup order and add the Templates
that are common to be loaded dynamically.

However, you need to initialize it once beforehand, otherwise there won't be any
interception of the Template lookup/include mechanism.

Consider the following example:

*`client/main.js`*
```javascript
import { TemplateLoader } from 'meteor/jkuester:template-loader'

TemplateLoader.enable()
    .register('myForm', async () => import('../path/to/myForm'))
    .register('myList', async () => import('../path/to/myList'))
    .register('myUser', async () => import('../path/to/myUser'))
    .register('myCard', async () => {
      const { dependency } = await import('../path/to/dependency')
      const { cardExport } = await import('../path/to/myCard')
      return  cardExport.inject(dependency)
    })
```

All these Templates are now automatically loaded via the given loader function.
As you can see, the operation is chainable and you can also include complex
import logic into the loader function.

Note, the Templates will not be imported before there is no other Template, that
includes them in it's HTML/SpaceBars code (or until it is manually imported).

You can add more Templates to autoload at any time.

Do not add the `import` function directly or it will trigger the import 
immediately and that would defy the purpose of this package:

```javascript
// XXX DO NOT DO IT LIKE THIS
TemplateLoader.register('myForm', import('../path/to/myForm'))
```

## Why do I want this?

Once your application bundle grows beyond 1MB (which can happen very fast!) you
need to consider dynamic imports to reduce initial bundle size.

A large initial bundle will rapidly delay the time to interact and may shut out
users with lower bandwidth. By dynamically importing Templates you can ensure to
deliver complex applications with great speed.

## Contribution

