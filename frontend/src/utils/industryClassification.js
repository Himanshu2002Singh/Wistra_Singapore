import industryCategories from '../../../shared/industry-classification.json' with { type: 'json' }

export const getIndustrySubCategories = (mainCategory) => industryCategories[mainCategory] || []

export const updateCorporateApplicationField = (current, name, value) => name === 'industry_main_category'
  ? { ...current, industry_main_category: value, industry_sub_category: '' }
  : { ...current, [name]: value }
