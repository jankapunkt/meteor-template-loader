/* global Spacebars */
import { check } from 'meteor/check'
import { ReactiveVar } from 'meteor/reactive-var'
import { Blaze } from 'meteor/blaze'

const getType = obj => Object.prototype.toString.call(obj)
const isPromise = obj => getType(obj) === '[object Promise]'
const isAsyncFn = obj => getType(obj) === '[object AsyncFunction]'

const originalLookup = Blaze.View.prototype.lookup
const originalInclude = Spacebars.include
const templateMap = new Map()
let initialized = false

/**
 * Allows templates to be registered and dynamically loaded at lookup-time.
 */
export const TemplateLoader = {}

/**
 * Registers a template for import at lookup time
 * @param template {String} the name of the Template
 * @param load {Function} a sync or async function that imports the template
 * @return {TemplateLoader} returns itself for chainable actions
 */
TemplateLoader.register = function (template, load) {
  check(template, String)
  check(load, Function)

  if (!templateMap.has(template)) {
    templateMap.set(template, { load, loaded: false })
  }

  return this
}

/**
 * Intercepts the {Blaze} / {SpaceBars} engine's Template lookup.
 * @return {TemplateLoader} returns itself for chainable actions
 */
TemplateLoader.enable = function init () {
  if (!initialized) {
    initialized = initializeLookup() && initializeSpacebars()
  }

  return this
}

/**
 * Gets, whether the loader is initialized.
 * @return {boolean} true if initialized, otherwise false
 */
TemplateLoader.initialized = () => initialized

/**
 * Restores the original state for the {Blaze} / {SpaceBars} engine's Template
 * lookup mechanism.
 * @return {TemplateLoader} returns itself for chainable actions
 */
TemplateLoader.disable = function () {
  if (initialized) {
    Blaze.View.prototype.lookup = originalLookup
    Spacebars.include = originalInclude
    initialized = false
  }
  return this
}

/**
 * @private
 */
function initializeLookup () {
  // First, we hook into the lookup and check, if there is any template
  // registered, that we have to load.
  // If so, we load and return the (chained) promise that can then be used
  // To reignite the lookup, once loaded.

  Blaze.View.prototype.lookup = function (name, _options) {
    if (!_options || !_options.template) {
      return originalLookup.call(this, name, _options)
    }

    const template = templateMap.get(name)
    if (!template || template.loaded === true) {
      return originalLookup.call(this, name, _options)
    }

    const isAsync = isAsyncFn(template.load)
    const promise = isAsync
      ? template.load()
      : new Promise(resolve => resolve(template.load()))

    return promise.then(() => {
      templateMap.set(name, { loaded: true })
      return { name, _options }
    })
  }

  return true
}

/**
 * @private
 */
function initializeSpacebars () {
  // Then, we hook into the include and contruct a custom view, in case
  // it receives a Promise (from lookup).
  // If se, we simply wait for the promise to be completed and then re-run
  // the template lookup, which should then returns the template.

  Spacebars.include = function (templateOrFunction, contentFunc, elseFunc) {
    if (!isPromise(templateOrFunction)) {
      return originalInclude.call(this, templateOrFunction, contentFunc, elseFunc)
    }

    const templateVar = new ReactiveVar(null)
    const view = Blaze.View('Spacebars.include', function () {
      const template = templateVar.get()
      if (template === null) {
        return null
      }

      if (!Blaze.isTemplate(template)) {
        throw new Error(`Expected template or null, found: ${template}`)
      }

      return template.constructView(contentFunc, elseFunc)
    })

    view.__templateVar = templateVar
    view.__startsNewLexicalScope = true

    templateOrFunction.then(({ name, _options }) => {
      const templ = view.lookup(name, _options)
      templateVar.set(templ)
    })

    return view
  }

  return true
}
