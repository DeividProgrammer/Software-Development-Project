import { get } from './helpers/ApiRequestsHelper'

function getProductCategories () {
  return get('productCategories')
}

function getPopular () {
  return get('products/popular')
}

function getAllProducts () {
  return get('products')
}

export { getProductCategories, getPopular, getAllProducts }
