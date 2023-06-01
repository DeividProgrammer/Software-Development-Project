/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, ImageBackground, Image, TouchableHighlight, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { getDetail } from '../../api/RestaurantEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import defaultImageRestaurant from '../../../assets/restaurantLogo.jpeg'
import defaultHeroImage from '../../../assets/restaurantBackground.jpeg'

export default function RestaurantDetailScreen ({ navigation, route }) {
  const [restaurant, setRestaurant] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)
  const [products, setProducts] = useState([])
  const { loggedInUser } = useContext(AuthorizationContext)
  const [hasProducts, setHasProducts] = useState(false)

  useEffect(() => {
    fetchRestaurantDetail()
    inicializeProducts() // puede dar fallo por loggin user o products.
  }, [route, loggedInUser])

  useEffect(() => {
    const productInCart = products.filter(x => x[1] > 0).length > 0
    setHasProducts(productInCart)
  }, [products])

  const onPress = (item, variacion) => {
    const copyProducts = [...products]
    let newTotalPrice = totalPrice
    for (let i = 0; i < products.length; i++) {
      if (copyProducts[i][0].id === item.id) {
        if (!(variacion === -1 && copyProducts[i][1] === 0)) {
          copyProducts[i][1] += variacion
          newTotalPrice += variacion * copyProducts[i][0].price
        }
        break
      }
    }
    setProducts(copyProducts)
    setTotalPrice(newTotalPrice)
  }

  const findProductQuantity = (item) => {
    let res = 0
    for (const product of products) {
      if (product[0].id === item.id) {
        res = product[1]
        break
      }
    }
    return res
  }

  const renderHeader = () => {
    return (
        <ImageBackground source={(restaurant?.heroImage) ? { uri: process.env.API_BASE_URL + '/' + restaurant.heroImage, cache: 'force-cache' } : defaultHeroImage} style={styles.imageBackground}>
          <View style={styles.restaurantHeaderContainer}>
            <TextSemiBold textStyle={styles.textTitle}>{restaurant.name}</TextSemiBold>
            <Image style={styles.image} source={restaurant.logo ? { uri: process.env.API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : defaultImageRestaurant} />
            <TextRegular textStyle={styles.description}>{restaurant.description}</TextRegular>
            <TextRegular textStyle={styles.description}>{restaurant.restaurantCategory ? restaurant.restaurantCategory.name : ''}</TextRegular>
          </View>
        </ImageBackground>
    )
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
        <TextRegular textStyle={styles.availability }>Not available</TextRegular>
      }

      {loggedInUser && item.availability &&
      <View style = {styles.generalAddorSubract}>
      <View style={styles.containerCount}>
        <TouchableHighlight onPress={() => onPress(item, -1)} underlayColor={'white'}>
          <View style={styles.buttonCount}>
            <TextRegular style = {styles.AddOrSubtract}>-</TextRegular>
          </View>
        </TouchableHighlight>
      </View>

      <View style={styles.countContainer}>
          <TextRegular style={styles.countText}>{findProductQuantity(item) }</TextRegular>
        </View>

      <View style={styles.containerCount}>
        <TouchableHighlight onPress={() => onPress(item, 1)} underlayColor={'white'}>
          <View style={styles.buttonCount}>
            <TextRegular style = {styles.AddOrSubtract}>+</TextRegular>
          </View>
        </TouchableHighlight>

      </View>
      </View>}
    </ImageCard>

    )
  }

  const renderEmptyProductsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        This restaurant has no products yet.
      </TextRegular>
    )
  }

  const fetchRestaurantDetail = async () => {
    try {
      const fetchedRestaurant = await getDetail(route.params.id)
      setRestaurant(fetchedRestaurant)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving restaurant details (id ${route.params.id}). ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const inicializeProducts = async () => {
    const fetchedRestaurant = await getDetail(route.params.id)
    const productsMap = fetchedRestaurant.products.map(p => [p, 0])

    setProducts(productsMap)
    setTotalPrice(0)
  }

  const selectedProduct = (products) => { // array {product, cantidad}
    const p = products.filter(x => x[1] > 0)
    return p
  }

  return (
    <>
      <FlatList
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyProductsList}
        style={styles.container}
        data={restaurant.products}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        />
        {loggedInUser && hasProducts && (
        <View>
        <Pressable onPress={() => navigation.navigate('OrderConfirmationScreen',
          { restaurantId: route.params.id, allProducts: selectedProduct(products), price: totalPrice, shippingCosts: route.params.shippingCosts })} // products contains an array of [id: quantity:0..n] with all products
          style={({ pressed }) => [
            {
              backgroundColor: pressed ? GlobalStyles.brandBlue : GlobalStyles.brandBlueTap,
              justifyContent: 'center',
              alignItems: 'center'
            },
            styles.button
          ]}>
          <TextRegular style = {styles.text}>View cart</TextRegular>
        </Pressable>
      </View>)
}
      </>
  )
}

const styles = StyleSheet.create({
  FRHeader: { // TODO: remove this style and the related <View>. Only for clarification purposes
    justifyContent: 'center',
    alignItems: 'left',
    margin: 50
  },

  generalAddorSubract: {
    flexDirection: 'row',
    width: '15%',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  containerCount: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: '20%'
  },
  buttonCount: {
    alignItems: 'center',
    backgroundColor: GlobalStyles.brandPrimary,
    padding: 5,
    borderRadius: 60
  },
  countContainer: {
    alignItems: 'center',
    padding: 2,
    paddingHorizontal: 10,
    width: '10%'

  },
  countText: { // numero de + -
    color: '000'
  },
  AddOrSubtract: {
    color: GlobalStyles.brandSecondary
  },
  container: {
    flex: 1
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
    fontSize: 15,
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
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '80%',
    backgroundColor: GlobalStyles.brandPrimary
  },
  text: {
    fontSize: 16,
    color: 'yellow',
    alignSelf: 'center',
    marginLeft: 5
  },
  availability: {
    fontSize: 20,
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
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  },

  title: {
    marginTop: 16,
    paddingVertical: 8,
    borderWidth: 4,
    borderColor: '#20232a',
    borderRadius: 6,
    backgroundColor: '#61dafb',
    color: '#20232a',
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold'
  }
})
