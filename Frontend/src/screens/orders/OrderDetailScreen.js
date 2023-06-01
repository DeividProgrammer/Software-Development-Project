/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Image, FlatList, ImageBackground } from 'react-native'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import { getDetailOrder } from '../../api/OrderEndpoints'
import { showMessage } from 'react-native-flash-message'
import * as GlobalStyles from '../../styles/GlobalStyles'
import ImageCard from '../../components/ImageCard'
import defaultHeroImage from '../../../assets/restaurantBackground.jpeg'

export default function OrderDetailScreen ({ navigation, route }) {
  const [order, setOrder] = useState({})
  const [restaurant, setRestaurant] = useState({})
  useEffect(() => {
    async function fetchDetailOrder () {
      try {
        const fetchedOrder = await getDetailOrder(route.params.id)
        setOrder(fetchedOrder)
        setRestaurant(fetchedOrder.restaurant)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving your orders. id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchDetailOrder()
  }, [route])

  const renderHeader = () => {
    return (
      <ImageBackground source={(restaurant?.heroImage) ? { uri: process.env.API_BASE_URL + '/' + restaurant.heroImage, cache: 'force-cache' } : defaultHeroImage} style={styles.imageBackground}>
        <View style={styles.restaurantHeaderContainer}>
          <Image style={styles.image} source={restaurant.logo ? { uri: process.env.API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : defaultHeroImage} />
          <TextSemiBold textStyle={styles.textTitle}>Order {order.id}</TextSemiBold>
          <TextRegular textStyle={styles.headerText}>Created at: {order.createdAt}</TextRegular>
          {order.startedAt && <TextRegular textStyle={styles.headerText}>Started at: {order.startedAt}</TextRegular>}
          <TextRegular textStyle={styles.headerText}>Total Price: {order.price} €</TextRegular>
          <TextRegular textStyle={styles.headerText}>Address: {order.address}</TextRegular>
          <TextRegular textStyle={styles.headerText}>Shipping costs: {order.shippingCosts} €</TextRegular>
          <TextSemiBold textStyle={styles.headerText}>Status: {order.status}</TextSemiBold>
        </View>
        </ImageBackground>
    )
  }

  const renderEmptyProductsList = () => {
    return (
      <TextSemiBold style={styles.emptyList}>
        No products can be shown.Order any products.
      </TextSemiBold>
    )
  }

  const renderProduct = ({ item }) => {
    return (
      <ImageCard
        imageUri={item.image ? { uri: process.env.API_BASE_URL + '/' + item.image } : undefined}
        title={item.name}
        >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold>Unity price: <TextRegular textStyle={styles.price}>{item.price.toFixed(2)} €</TextRegular></TextSemiBold>
        <TextSemiBold>Quantity: <TextRegular>{item.OrderProducts.quantity} Unidades</TextRegular></TextSemiBold>
        <TextSemiBold>Total price: <TextRegular>{item.price.toFixed(2) * item.OrderProducts.quantity} €</TextRegular></TextSemiBold>
      </ImageCard>
    )
  }

  return (
    <FlatList
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyProductsList}
      style={styles.container}
      data={order.products}
      renderItem={renderProduct}
      keyExtractor={item => item.id.toString()}
    />
  )
}

const styles = StyleSheet.create({
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
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
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
    marginBottom: 5,
    marginTop: 1
  },
  description: {
    color: 'white'

  },
  textTitle: {
    fontSize: 24,
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
    alignItems: 'center'
  },
  text: {
    fontSize: 16,
    color: GlobalStyles.brandSecondaryTap,
    textAlign: 'center',
    marginLeft: 5
  },
  headerText: {
    color: 'white',
    textAlign: 'center'
  }
})
