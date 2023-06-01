'use strict'
const models = require('../models')
const Order = models.Order
const Product = models.Product
const Restaurant = models.Restaurant
const User = models.User
const moment = require('moment')
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const { validationResult } = require('express-validator')

const generateFilterWhereClauses = function (req) {
  const filterWhereClauses = []
  if (req.query.status) {
    switch (req.query.status) {
      case 'pending':
        filterWhereClauses.push({
          startedAt: null
        })
        break
      case 'in process':
        filterWhereClauses.push({
          [Op.and]: [
            {
              startedAt: {
                [Op.ne]: null
              }
            },
            { sentAt: null },
            { deliveredAt: null }
          ]
        })
        break
      case 'sent':
        filterWhereClauses.push({
          [Op.and]: [
            {
              sentAt: {
                [Op.ne]: null
              }
            },
            { deliveredAt: null }
          ]
        })
        break
      case 'delivered':
        filterWhereClauses.push({
          sentAt: {
            [Op.ne]: null
          }
        })
        break
    }
  }
  if (req.query.from) {
    const date = moment(req.query.from, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.gte]: date
      }
    })
  }
  if (req.query.to) {
    const date = moment(req.query.to, 'YYYY-MM-DD', true)
    filterWhereClauses.push({
      createdAt: {
        [Op.lte]: date.add(1, 'days') // FIXME: se pasa al siguiente día a las 00:00
      }
    })
  }
  return filterWhereClauses
}

// Returns :restaurantId orders
exports.indexRestaurant = async function (req, res) {
  const whereClauses = generateFilterWhereClauses(req)
  whereClauses.push({
    restaurantId: req.params.restaurantId
  })
  try {
    const orders = await Order.findAll({
      where: whereClauses,
      include: {
        model: Product,
        as: 'products'
      }
    })
    res.json(orders)
  } catch (err) {
    res.status(500).send(err)
  }
}

// TODO: Implement the indexCustomer function that queries orders from current logged-in customer and send them back.
// Orders have to include products that belongs to each order and restaurant details
// sort them by createdAt date, desc.
// Exportamos la función indexCustomer de manera asíncrona y le pasamos los parámetros de petición (req) y respuesta (res)
exports.indexCustomer = async function (req, res) {
  try {
    // Utilizamos el modelo de la orden (Order) para encontrar todas las órdenes del usuario que realiza la petición
    const orders = await Order.findAll({
      where: { userId: req.user.id }, // Filtamos por el id del usuario que realiza la petición
      include: [{
        model: Restaurant, // Incluimos el modelo de restaurante (Restaurant)
        as: 'restaurant' // Indicamos que lo llamaremos 'restaurant'
      },
      {
        model: Product, // Incluimos el modelo de producto (Product)
        as: 'products' // Indicamos que lo llamaremos 'products'
      }],
      order: [['createdAt', 'DESC']]
    })
    // Ordenamos las órdenes por fecha de creación
    // Enviamos la respuesta como un objeto JSON que contiene todas las órdenes y sus respectivos restaurantes y productos
    res.json(orders)
  } catch (err) {
    // En caso de error, enviamos una respuesta con estad 500 y el mensaje de error correspondiente
    res.status(500).send(err)
  }
}

// TODO: Implement the create function that receives a new order and stores it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the order and related products, start a transaction, store the order, store each product linea and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction

exports.create = async function (req, res) {
  // Validamos la petición usando la función "validationResult"
  const err = validationResult(req)

  // Si hay errores de validación, respondemos con un estado 422 y enviamos los errores en la respuesta
  if (err.errors.length > 0) {
    res.status(422).send(err)
  } else {
    // Si no hay errores de validación, iniciamos una transacción
    const t = await sequelize.transaction

    try {
      // Creamos una nueva orden con los datos de la petición
      const newOrder = Order.build(req.body)
      newOrder.createdAt = Date.now()
      newOrder.startedAt = null
      newOrder.deliveredAt = null
      newOrder.userId = req.user.id

      // Calculamos los costos de envío de la orden según la regla de negocio 2
      const restaurant = await Restaurant.findByPk(req.body.restaurantId)
      let precio = 0.0
      for (const product of req.body.products) {
        const databaseProduct = await Product.findByPk(product.productId)
        precio += product.quantity * databaseProduct.price
      }

      if (precio > 10) {
        newOrder.shippingCosts = 0.0
      } else {
        newOrder.shippingCosts = restaurant.shippingCosts
      }
      newOrder.price = precio + newOrder.shippingCosts

      // Creamos la orden en la base de datos dentro de la transacción
      const order = await Order.create({
        createdAd: newOrder.createdAt,
        startedAt: newOrder.startedAt,
        sentAt: newOrder.sentAt,
        deliveredAt: newOrder.deliveredAt,
        price: newOrder.price,
        address: newOrder.address,
        shippingCosts: newOrder.shippingCosts,
        restaurantId: newOrder.restaurantId,
        userId: newOrder.userId,
        status: null
      }, { transaction: t })

      // Agregamos los productos a la orden y especificamos la cantidad y el precio unitario de cada uno
      for (const product of req.body.products) {
        const databaseProduct = await Product.findByPk(product.productId)
        await order.addProduct(databaseProduct, { through: { quantity: product.quantity, unityPrice: databaseProduct.price } })
      }
      const orderFinal = await Order.findByPk(order.id, {
        include: [{
          model: Product,
          as: 'products'
        }
        ]
      })

      // Si todo ha salido bien, respondemos con un objeto JSON que contiene la nueva orden
      res.json(orderFinal)
    } catch (error) {
      // En caso de error, si el error es de validación, respondemos con un estado 422 y enviamos el error en la respuesta. Si no, respondemos con un estado 500 y enviamos el error en la respuesta.
      if (error.name.includes('ValidationError')) {
        res.status(422).send(error)
      } else {
        res.status(500).send(error)
      }
    }
  }
}

// TODO: Implement the update function that receives a modified order and persists it in the database.
// Take into account that:
// 1. If price is greater than 10€, shipping costs have to be 0.
// 2. If price is less or equals to 10€, shipping costs have to be restaurant default shipping costs and have to be added to the order total price
// 3. In order to save the updated order and updated products, start a transaction, update the order, remove the old related OrderProducts and store the new product lines, and commit the transaction
// 4. If an exception is raised, catch it and rollback the transaction

// Exportamos la función update de manera asíncrona y le pasamos los parámetros de petición (req) y respuesta (res)
exports.update = async function (req, res) {
  const err = validationResult(req)
  // Si hay errores de validación, respondemos con un estado 422 y enviamos los errores en la respuesta
  if (err.errors.length > 0) {
    res.status(422).send(err)
  } else {
    // Si no hay errores de validación, iniciamos una transacción
    // Comenzamos una transacción
    const t = await models.sequelize.transaction()

    try {
      // Buscamos la orden a actualizar por su id
      let order = await Order.findByPk(req.params.orderId, {
        include: [{
          model: Product, // Incluimos el modelo de producto (Product)
          as: 'products' // Indicamos que lo llamaremos 'products'
        }]
      })

      // Si no se encuentra la orden, lanzamos un error
      // if (!order) {
      //   throw new Error(`Order with id ${req.params.orderId} not found`)
      // }
      order.address = req.body.address

      // Calculamos los costos de envío de la orden según las reglas de negocio
      const restaurant = await Restaurant.findByPk(order.restaurantId)
      let precio = 0.0
      for (const product of req.body.products) {
        const databaseProduct = await Product.findByPk(product.productId)
        precio += product.quantity * databaseProduct.price
      }
      if (precio > 10) {
        order.shippingCosts = 0.0
      } else {
        order.shippingCosts = restaurant.shippingCosts
      }
      order.price = precio + order.shippingCosts

      // Removemos los productos antiguos de la orden
      order = await order.save({ t })
      await order.setProducts([], t)
      order = await order.save({ t })
      for (const product of req.body.products) {
        const producto = await Product.findByPk(product.productId)
        await order.addProduct(product.productId, { through: { quantity: product.quantity, unityPrice: producto.price }, t })
      }
      await t.commit()

      const modifiedOrder = await Order.findByPk(order.id, { include: { model: Product, as: 'products' } })
      res.json(modifiedOrder)
    } catch (err) {
      // En caso de error, hacemos un rollback de la transacción y enviamos una respuesta con estado 500 y el mensaje de error correspondiente
      await t.rollback()
      res.status(500).send(err)
    }
  }
}

// TODO: Implement the destroy function that receives an orderId as path param and removes the associated order from the database.
// Take into account that:
// 1. The migration include the "ON DELETE CASCADE" directive so OrderProducts related to this order will be automatically removed.
exports.destroy = async function (req, res) {
  try {
    // Eliminar la orden de la base de datos donde el ID coincide con el orderId pasado como parámetro.
    const result = await Order.destroy({ where: { id: req.params.orderId } })
    let message = ''
    if (result === 1) {
      // Si el resultado es 1, la orden se eliminó correctamente.
      message = 'Successfully deleted order id.' + req.params.orderId + '.'
    } else {
      // Si el resultado no es 1, es posible que la orden no exista.
      message = 'Could not delete order.'
    }
    // Enviar la respuesta como JSON
    res.json(message)
  } catch (err) {
    // En caso de un error, enviar una respuesta con el estado 500 y el error.
    res.status(500).send(err)
  }
}

exports.confirm = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.startedAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.send = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.sentAt = new Date()
    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.deliver = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId)
    order.deliveredAt = new Date()
    const updatedOrder = await order.save()
    const restaurant = await Restaurant.findByPk(order.restaurantId)
    const averageServiceTime = await restaurant.getAverageServiceTime()
    await Restaurant.update({ averageServiceMinutes: averageServiceTime }, { where: { id: order.restaurantId } })
    res.json(updatedOrder)
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.show = async function (req, res) {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['name', 'description', 'address', 'postalCode', 'url', 'shippingCosts', 'averageServiceMinutes', 'email', 'phone', 'logo', 'heroImage', 'status', 'restaurantCategoryId']
      },
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'email', 'avatar', 'userType']
      },
      {
        model: Product,
        as: 'products'
      }]
    })
    res.json(order)
  } catch (err) {
    res.status(500).send(err)
  }
}

exports.analytics = async function (req, res) {
  const yesterdayZeroHours = moment().subtract(1, 'days').set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  const todayZeroHours = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  try {
    const numYesterdayOrders = await Order.count({
      where:
      {
        createdAt: {
          [Op.lt]: todayZeroHours,
          [Op.gte]: yesterdayZeroHours
        },
        restaurantId: req.params.restaurantId
      }
    })
    const numPendingOrders = await Order.count({
      where:
      {
        startedAt: null,
        restaurantId: req.params.restaurantId
      }
    })
    const numDeliveredTodayOrders = await Order.count({
      where:
      {
        deliveredAt: { [Op.gte]: todayZeroHours },
        restaurantId: req.params.restaurantId
      }
    })

    const invoicedToday = await Order.sum(
      'price',
      {
        where:
        {
          createdAt: { [Op.gte]: todayZeroHours }, // FIXME: Created or confirmed?
          restaurantId: req.params.restaurantId
        }
      })
    res.json({
      restaurantId: req.params.restaurantId,
      numYesterdayOrders,
      numPendingOrders,
      numDeliveredTodayOrders,
      invoicedToday
    })
  } catch (err) {
    res.status(500).send(err)
  }
}
