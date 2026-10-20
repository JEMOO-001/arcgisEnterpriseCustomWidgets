export interface CategoryItem {
  value: string | number
  label: string
}

export function categoryWhere(field: string, selectedValues: string[], categories: CategoryItem[]): string {
  // Empty means no category filter; one preserves equality; many match any selected code.
  if (selectedValues.length === 0) return '1=1'
  const literals = selectedValues.map(selected => {
    const original = categories.find(category => String(category.value) === selected)?.value ?? selected
    return typeof original === 'number' ? String(original) : `'${original.replace(/'/g, "''")}'`
  })
  return literals.length === 1 ? `${field} = ${literals[0]}` : `${field} IN (${literals.join(', ')})`
}
