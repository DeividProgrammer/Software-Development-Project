const { check } = require('express-validator')
const models = require('../../models')
const Product = models.Product
const Order = models.Order
const Restaurant = models.Restaurant

const checkOrderPending = async (value, { req }) => {
  try {
    const order = await Order.findByPk(req.params.orderId,
      {
        attributes: ['startedAt']
      })
    if (order.startedAt) {
      return Promise.reject(new Error('The order has already been started'))
    } else {
      return Promise.resolve('ok')
    }
  } catch (err) {
    return Promise.reject(err)
  }
}
const checkOrderCanBeSent = async (value, { req }) => {
  try {
    const order = await Order.findByPk(req.params.orderId,
      {
        attributes: ['startedAt', 'sentAt']
      })
    if (!order.startedAt) {
      return Promise.reject(new Error('The order is not started'))
    } else if (order.sentAt) {
      return Promise.reject(new Error('The order has already been sent'))
    } else {
      return Promise.resolve('ok')
    }
  } catch (err) {
    return Promise.reject(err)
  }
}
const checkOrderCanBeDelivered = async (value, { req }) => {
  try {
    const order = await Order.findByPk(req.params.orderId,
      {
        attributes: ['startedAt', 'sentAt', 'deliveredAt']
      })
    if (!order.startedAt) {
      return Promise.reject(new Error('The order is not started'))
    } else if (!order.sentAt) {
      return Promise.reject(new Error('The order is not sent'))
    } else if (order.deliveredAt) {
      return Promise.reject(new Error('The order has already been delivered'))
    } else {
      return Promise.resolve('ok')
    }
  } catch (err) {
    return Promise.reject(err)
  }
}
const checkRestaurantExists = async (value, { req }) => {
  try {
    const restaurant = await Restaurant.findByPk(req.body.restaurantId)
    if (restaurant === null) {
      return Promise.reject(new Error('The restaurantId does not exist.'))
    } else { return Promise.resolve() }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}
const checkNonemptyArray = async (value, { req }) => {
  try {
    if (Array.isArray(value) && value.length > 0 && value.every(p => p.productId > 0 && p.quantity > 0)) {
      return Promise.resolve('okey')
    } else {
      return Promise.reject(new Error('The Array does not check the that products is a non-empty array composed of objects with productId and quantity greater than 0.'))
    }
  } catch (error) {
    return Promise.reject(new Error(error))
  }
}
const checkAvailability = async (value, { req }) => {
  try {
    for (const prod of req.body.products) {
      const product = await Product.findByPk(prod.productId)
      if (!product.availability) {
        return Promise.reject(new Error('The product is not available.'))
      }
    }
    return Promise.resolve('okey')
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}
const checkSameRestaurantI = async (value, { req }) => {
  try {
    let problem = false
    let index = 0
    while (index < value.length && !problem) {
      const element = value[index]
      const product = await Product.findByPk(element.productId)
      if (product === null || product.restaurantId !== req.body.restaurantId) {
        problem = true
      }
      index++
    }
    if (problem) { // Comprobamos si se incumplen alguna de las restricciones
      return Promise.reject(new Error('The productsId is not valid or does not belong to that restaurant'))
    } else {
      return Promise.resolve('ok')
    }
  } catch (error) {
    return Promise.reject(error)
  }
}
const checkSameRestaurantUpdate = async (value, { req }) => {
  const order = await Order.findByPk(req.params.orderId)
  for (const producto of req.body.products) {
    const existsProduct = await Product.findByPk(producto.productId)
    if (order.restaurantId !== existsProduct.restaurantId) {
      return Promise.reject(new Error('The productId is not valid or does not belong to that restaurant'))
    }
  }
  return Promise.resolve('ok')
}

function destroyOrder (order) {
  if (order.status === 'pending') {
    console.log('Order deleted ')
  }
}
const checkStatus = async (value, { req }) => {
  try {
    const order = await Order.findByPk(req.params.orderId)
    if (order.status === 'pending') {
      return Promise.resolve('The order is in the pending state.')
    } else { return Promise.reject(new Error('The order is not in pending state')) }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}
module.exports = {
  // TODO: Include validation rules for create that should:

  create: [
  // 1. Check that restaurantId is present in the body and corresponds to an existing restaurant
    check('restaurantId').custom(checkRestaurantExists),
    // 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0
    check('products').custom(checkNonemptyArray),
    // 3. Check that products are available
    check('products').custom(checkAvailability),
    // 4. Check that all the products belong to the same restaurant
    check('products').custom(checkSameRestaurantI)

  ],
  // TODO: Include validation rules for update that should:

  update: [
  // 1. Check that restaurantId is NOT present in the body.
    check('restaurantId').not().exists().withMessage('The restaurantId cannot be in the body.'),
    // 2. Check that products is a non-empty array composed of objects with productId and quantity greater than 0.
    check('products').custom(checkNonemptyArray),
    // 3. Check that products are available
    check('products').custom(checkAvailability),
    // 4. Check that all the products belong to the same restaurant of the originally saved order that is being edited.
    check('products').custom(checkSameRestaurantUpdate),
    // 5. Check that the order is in the 'pending' state.
    check('status').custom(checkStatus)
  ],
  // TODO: Include validation rules for destroying an order that should check if the order is in the 'pending' state

  destroy: [
    check('status').custom(checkOrderPending)
  ],
  confirm: [
    check('startedAt').custom(checkOrderPending)
  ],
  send: [
    check('sentAt').custom(checkOrderCanBeSent)
  ],
  deliver: [
    check('deliveredAt').custom(checkOrderCanBeDelivered)
  ]
}
