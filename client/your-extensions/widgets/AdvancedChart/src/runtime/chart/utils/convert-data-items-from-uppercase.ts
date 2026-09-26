const createFieldsUpperCaseMap = (fields: string[]) => {
  const map = {}
  fields.forEach((field) => {
    map[field.toUpperCase()] = field
    map[field] = field.toUpperCase()
  })
  return map
}

const convertDataItemsFromUpperCase = (dataItems: { [x: string]: any }, fields: string[]) => {
  if (!fields?.length || !dataItems) return dataItems
  const map = createFieldsUpperCaseMap(fields)
  const items = dataItems.map((item) => {
    const newItem = {}
    Object.keys(item).forEach((key) => {
      if (map[key]) {
        newItem[map[key]] = item[key]
      } else {
        newItem[key] = item[key]
      }
    })
    return newItem
  })
  return items
}

export default convertDataItemsFromUpperCase
