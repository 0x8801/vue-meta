import deepmerge from 'deepmerge'
import applyTemplate from './applyTemplate'
import { metaInfoAttributeKeys } from './constants'

export function arrayMerge({ component, tagIDKeyName, metaTemplateKeyName, contentKeyName }, target, source) {
  // we concat the arrays without merging objects contained in,
  // but we check for a `vmid` property on each object in the array
  // using an O(1) lookup associative array exploit
  const destination = []

  target.forEach((targetItem, targetIndex) => {
    // no tagID so no need to check for duplicity
    if (!targetItem[tagIDKeyName]) {
      destination.push(targetItem)
      return
    }

    const sourceIndex = source.findIndex(item => item[tagIDKeyName] === targetItem[tagIDKeyName])
    const sourceItem = source[sourceIndex]

    // source doesnt contain any duplicate id's
    // or the source item should be ignored
    if (sourceIndex === -1 || sourceItem[contentKeyName] === false || sourceItem.innerHTML === false) {
      destination.push(targetItem)
      return
    }

    // we now know that targetItem is a duplicate and we should ignore it in favor of sourceItem
    // now we only need to check if the target has a template to combine it with the source
    const targetTemplate = targetItem[metaTemplateKeyName]
    if (!targetTemplate) {
      return
    }

    const sourceTemplate = sourceItem[metaTemplateKeyName]

    if (!sourceTemplate) {
      // use parent template and child content
      applyTemplate({ component, metaTemplateKeyName, contentKeyName }, sourceItem, targetTemplate)
    } else if (!sourceItem[contentKeyName]) {
      // use child template and parent content
      applyTemplate({ component, metaTemplateKeyName, contentKeyName }, sourceItem, undefined, targetItem[contentKeyName])
    }
  })

  return destination.concat(source)
}

export function merge(target, source, options = {}) {
  // remove properties explicitly set to false so child components can
  // optionally _not_ overwrite the parents content
  // (for array properties this is checked in arrayMerge)
  if (source.title === false) {
    delete source.title
  }

  for (const attrKey in metaInfoAttributeKeys) {
    if (!source[attrKey]) {
      continue
    }

    for (const key in source[attrKey]) {
      if (source[attrKey][key] === false) {
        delete source[attrKey][key]
      }
    }
  }

  return deepmerge(target, source, {
    arrayMerge: (t, s) => arrayMerge(options, t, s)
  })
}
