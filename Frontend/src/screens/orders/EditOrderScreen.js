import React, { useState, useContext, useEffect } from 'react'
import { View, ScrollView, Text, StyleSheet, Pressable, FlatList } from 'react-native'
import { Formik } from 'formik'
import InputItem from '../../components/InputItem'
import { update } from '../../api/OrderEndpoints'
import * as yup from 'yup'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import TextError from '../../components/TextError'
import defaultProductImage from '../../../assets/product.jpeg'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { getDetail } from '../../api/RestaurantEndpoints'

export default function OrderConfirmationScreen ({ navigation, route }) {
  const { loggedInUser } = useContext(AuthorizationContext)
  const [productQuantity, setProductQuantity] = useState(null)
  const [products, setProducts] = useState([])
  const [totalPrice, setTotalPrice] = useState(route.params.totalPrice)
  const [backendErrors, setBackendErrors] = useState()
  const [order] = useState({
    address: route.params.address,
    products: route.params.productQuantity
      .map(e => ({ productId: e.id, quantity: e.OrderProducts.quantity }))
      .filter(x => x.quantity !== 0)
  })

  const validationSchema = yup.object().shape({
    address: yup
      .string()
      .required('Insert an address'),
    products: yup
      .array()
      .min(1, 'Products can not be empty')
  })

  useEffect(() => {
    fetchProducts()
  }, [route])

  const fetchProducts = async () => {
    const fetchedRestaurant = await getDetail(route.params.restaurantId)
    setProducts(fetchedRestaurant.products)
    const initialProductQuantity = fetchedRestaurant.products.map(p => [p, 0])
    for (let i = 0; i < initialProductQuantity.length; i++) {
      for (let j = 0; j < order.products.length; j++) {
        if (initialProductQuantity[i][0].id === order.products[j].productId) {
          initialProductQuantity[i][1] = order.products[j].quantity
        }
      }
    }
    setProductQuantity(initialProductQuantity)
  }

  const getQuantity = (item) => {
    let res = 0
    for (let i = 0; i < productQuantity?.length; i++) {
      if (productQuantity[i][0].id === item.id) {
        res = productQuantity[i][1]
        break
      }
    }
    return res
  }

  const varQuantity = (id, variacion) => {
    const copyProductQuantity = [...productQuantity]
    let newTotalPrice = totalPrice
    for (let i = 0; i < products.length; i++) {
      if (copyProductQuantity[i][0].id === id) {
        if (!(variacion === -1 && copyProductQuantity[i][1] === 0)) {
          copyProductQuantity[i][1] += variacion
          newTotalPrice += variacion * copyProductQuantity[i][0].price
        }
        break
      }
    }
    setProductQuantity(copyProductQuantity)

    order.products = productQuantity.map(e => ({ productId: e[0].id, quantity: e[1] })).filter(x => x.quantity !== 0)
    setTotalPrice(newTotalPrice)
  }

  const renderProduct = ({ item }) => {
    return (
      <ImageCard
        imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : defaultProductImage}
        title={item.name}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemiBold>
        {!item.availability &&
          <TextRegular textStyle={styles.availability}>Not available</TextRegular>
        }
        {
          item.availability && loggedInUser &&
          <View style={styles.quantityContainer}>
            <MaterialCommunityIcons name='arrow-down-circle' size={18} onPress={() => varQuantity(item.id, -1)} />
            <Text style={{ paddingLeft: 20 }} >Quantity: {getQuantity(item)}</Text>
            <MaterialCommunityIcons style={{ paddingLeft: 20 }} name='arrow-up-circle' size={18} onPress={() => varQuantity(item.id, +1)} />
            <Text style={{ paddingLeft: 20 }} >Price: {(getQuantity(item) * item.price).toFixed(2)}€</Text>
          </View>
        }
      </ImageCard>
    )
  }

  const windowTotalPrice = () => {
    return (<Text style={styles.totalPrice}>Total Price: {totalPrice.toFixed(2)}€</Text>)
  }

  const updateOrder = async (data) => {
    setBackendErrors([])
    try {
      await update(route.params.id, data)
      showMessage({
        message: 'Your order has been edited successfully',
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('OrdersScreen')
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }

  return (
    <ScrollView>
      <Formik
      validationSchema={validationSchema}
      enableReinitialize
      initialValues={order}
      onSubmit={updateOrder}>
        {({ handleSubmit }) => (
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: '60%' }}>
                <FlatList
                  data={products}
                  renderItem={renderProduct}
                  ListFooterComponent={windowTotalPrice}
                />
                <InputItem
                  placeholder='Insert an address'
                  name='address'
                  label='Address:'
                />
                {
                backendErrors &&
                      backendErrors.map((error, index) => <TextError key={index}>{error.msg}</TextError>)
                }
                  <View style={styles.containerConfirm}>
                    <View style={styles.containerQuestion}>
                      <Text style={styles.textQuestion}>Do you want to change your order?</Text>
                    </View>
                    <Pressable
                      style={styles.buttonAffirm}
                      onPress={handleSubmit}
                    >
                      <Text style={styles.textButton} > Confirm
                        <MaterialCommunityIcons name='check-circle' color={'white'} size={20} />
                      </Text>
                    </Pressable>
                    <Pressable style={styles.buttonNegation}
                      onPress={() => {
                        navigation.navigate('OrdersScreen')
                      }
                      }
                    >
                      <Text style={styles.textButton}> Cancel
                        <MaterialCommunityIcons name='close-circle' color={'white'} size={20} />
                      </Text>
                    </Pressable>
                  </View>
              </View>

            </View>
        )}

      </Formik>
    </ScrollView>

  )
}

const styles = StyleSheet.create({
  FRHeader: { // TODO: remove this style and the related <View>. Only for clarification purposes
    justifyContent: 'center',
    alignItems: 'left',
    margin: 50
  },
  totalPrice: {
    alignSelf: 'center',
    fontSize: 20,
    padding: 20
  },
  container: {
    flex: 1
  },
  canceledMessContent: {
    paddingTop: 50,
    fontSize: 20,
    backgroundColor: 'rgba(255,0,0,0.8)'
  },
  containerConfirm: {
    alignSelf: 'center',
    alignContent: 'center',
    borderRadius: 20,
    margin: 50,
    width: '60%',
    backgroundColor: 'rgba(195, 182, 188, 0.8)'
  },
  containerQuestion: {
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 20,
    padding: 10,
    backgroundColor: GlobalStyles.brandBackground
  },
  quantityContainer: {
    margin: 20,
    width: '90%',
    flexDirection: 'row'
  },
  textQuestion: {
    textDecorationStyle: 'solid',
    fontSize: 20
  },
  buttonAffirm: {
    borderRadius: 8,
    marginTop: 40,
    margin: 20,
    padding: 10,
    backgroundColor: GlobalStyles.brandSuccess
  },
  buttonNegation: {
    borderRadius: 8,
    margin: 20,
    padding: 10,
    backgroundColor: GlobalStyles.brandPrimary
  },
  row: {
    padding: 15,
    marginBottom: 5,
    backgroundColor: GlobalStyles.brandSecondary
  },
  restaurantHeaderContainer: {
    height: 250,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  image: {
    height: 100,
    width: 100,
    margin: 10
  },
  description: {
    color: 'white'
  },
  textTitle: {
    fontSize: 20,
    color: 'white'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  button: {
    borderRadius: 8,
    height: 40,
    margin: 12,
    padding: 2,
    alignSelf: 'center',
    width: '14%',
    backgroundColor: GlobalStyles.brandGreen
  },
  textButton: {
    alignSelf: 'center',
    justifyContent: 'center',
    textDecorationStyle: 'double',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 20
  },
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  availability: {
    textAlign: 'right',
    marginRight: 5,
    color: GlobalStyles.brandSecondary
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%'
  },
  actionButtonsContainer: {
    marginTop: 20,
    bottom: 5,
    width: '90%'
  }
})
