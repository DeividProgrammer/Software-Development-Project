import { get, post, put, destroy } from './helpers/ApiRequestsHelper'

function getAllOrders () {
  return get('orders')
}

function getDetailOrder (id) {
  return get(`orders/${id}`)
}

function create (data) {
  return post('orders', data)
}

function update (id, data) {
  return put(`orders/${id}`, data)
}

function remove (id) {
  return destroy(`orders/${id}`)
}

export { getAllOrders, getDetailOrder, create, update, remove }
