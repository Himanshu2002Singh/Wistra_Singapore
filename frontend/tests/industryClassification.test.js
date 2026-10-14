import assert from 'node:assert/strict'
import industryCategories from '../../shared/industry-classification.json' with { type: 'json' }
import { getIndustrySubCategories, updateCorporateApplicationField } from '../src/utils/industryClassification.js'

assert.deepEqual(Object.keys(industryCategories), [
  'Ship Owners & Operators',
  'Port & Logistics Operations',
  'Technical & Marine Services',
  'Professional Services',
  'Shipyards, Supply & Bunkering',
  'Technology & Innovation',
  'Authorities & Education',
])
for (const [category, subCategories] of Object.entries(industryCategories)) {
  assert.deepEqual(getIndustrySubCategories(category), subCategories, `${category} options must remain exact and ordered`)
}
assert.deepEqual(getIndustrySubCategories(''), [])
assert.deepEqual(getIndustrySubCategories('Unknown category'), [])

const selectionAfterCategoryChange = updateCorporateApplicationField({
  company_name: 'Example Ltd',
  industry_main_category: 'Ship Owners & Operators',
  industry_sub_category: 'Ship Manager',
}, 'industry_main_category', 'Technical & Marine Services')
assert.equal(selectionAfterCategoryChange.company_name, 'Example Ltd')
assert.equal(selectionAfterCategoryChange.industry_main_category, 'Technical & Marine Services')
assert.equal(selectionAfterCategoryChange.industry_sub_category, '')

console.log(`Industry classification UI logic passed: ${Object.keys(industryCategories).length} categories, ${Object.values(industryCategories).flat().length} mapped sub-categories, and category-change reset.`)
