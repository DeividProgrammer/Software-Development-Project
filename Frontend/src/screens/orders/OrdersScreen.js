import React, { useContext, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import TextRegular from '../../components/TextRegular'
import TextSemibold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { getAllOrders, remove } from '../../api/OrderEndpoints'
import { showMessage } from 'react-native-flash-message'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import ImageCard from '../../components/ImageCard'
import { FlatList } from 'react-native-web'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DeleteModal from '../../components/DeleteModal'
import defaultImageRestaurant from '../../../assets/restaurantLogo.jpeg'

export default function OrdersScreen ({ navigation, route }) {
  const [orders, setOrders] = useState([])
  const [orderToBeDeleted, setOrderToBeDeleted] = useState(null)
  const { loggedInUser } = useContext(AuthorizationContext)

  // FR5: Listing my confirmed orders.
  // A Customer will be able to check his/her confirmed orders, sorted from the most recent to the oldest.

  useEffect(() => {
    if (loggedInUser) {
      fetchOrders()
    } else {
      setOrders(null)
    }
  }, [loggedInUser])

  const renderOrders = ({ item }) => {
    return (
      <>
      <ImageCard
        imageUri={item.restaurant.logo ? { uri: process.env.API_BASE_URL + '/' + item.restaurant.logo } : defaultImageRestaurant}
        onPress={() => {
          navigation.navigate('OrderDetailScreen', { id: item.id, dirty: true })
        }}
      >

        <TextSemibold textStyle={{ fontSize: 16, color: 'black' }}>Order {item.id}</TextSemibold>
        <TextSemibold>Created at: <TextRegular numberOfLines={2}>{item.createdAt}</TextRegular></TextSemibold>
        <TextSemibold>Price: <TextRegular style={{ color: GlobalStyles.brandPrimary }}>{item.price.toFixed(2)} €</TextRegular></TextSemibold>
        <TextSemibold>Shipping: <TextRegular style={{ color: GlobalStyles.brandPrimary }}>{item.shippingCosts.toFixed(2)} €</TextRegular></TextSemibold>
        <TextSemibold>Status: <TextRegular style={{ color: GlobalStyles.brandPrimary }}>{item.status}</TextRegular></TextSemibold>

      <View style= {styles.actionButtonsContainer}>
      {item.status === 'pending' && <Pressable onPress={() => navigation.navigate('EditOrderScreen', { id: item.id, address: item.address, productQuantity: item.products, totalPrice: (item.price - item.shippingCosts), restaurantId: item.restaurantId })} // products contains an array of [id: quantity:0..n] with all products
          style={({ pressed }) => [
            {
              backgroundColor: pressed ? GlobalStyles.brandBlue : GlobalStyles.brandBlueTap,
              justifyContent: 'center',
              alignItems: 'center'
            },
            styles.actionButton
          ]}>
          <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'space-between' }]}>
          <MaterialCommunityIcons name='circle-edit-outline' color={'white'} size={20}/>
          <TextRegular textStyle={styles.text}>
            Edit order
          </TextRegular>
        </View>
        </Pressable>

      }

      { item.status === 'pending' &&
        < Pressable
            onPress = {() => { setOrderToBeDeleted(item) }}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed
                    ? GlobalStyles.brandPrimaryTap
                    : GlobalStyles.brandPrimary
                },
                styles.actionButton
              ]} >
            <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
          <MaterialCommunityIcons name='plus-circle' color={'white'} size={20}/>
          <TextRegular textStyle={styles.text}>
            Delete order
          </TextRegular>
        </View>
      </Pressable> }
      </View>
      </ImageCard>
      </>
    )
  }

  const renderEmptyOrder = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No orders were retreived. Are you logged in?
      </TextRegular>
    )
  }
  async function fetchOrders () {
    try {
      const fetchedOrders = await getAllOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving the orders. ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        textStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const removeOrder = async (order) => {
    try {
      await remove(order.id)
      await fetchOrders()
      setOrderToBeDeleted(null)
      showMessage({
        message: `Order ${order.id} successfully deleted`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } catch (error) {
      console.log(error)
      setOrderToBeDeleted(null)
      showMessage({
        message: `Restaurant ${order.id} could not be removed.`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
   <View style={styles.container}>
      <FlatList
        style={styles.container}
        data={orders}
        renderItem={renderOrders}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyOrder}
        />
        <DeleteModal
        isVisible={orderToBeDeleted !== null}
        onCancel={() => setOrderToBeDeleted(null)}
        onConfirm={() => removeOrder(orderToBeDeleted)}>
        <TextRegular>Once you delete an order, you cannot revert it</TextRegular>
        </DeleteModal>
   </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  text: {
    fontSize: 16,
    color: GlobalStyles.brandSecondary,
    textAlign: 'center'
  },
  textTitle: {
    fontSize: 20,
    color: 'black'
  },
  emptyList: {
    textAlign: 'center',
    padding: 50
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '40%'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '100%',
    marginLeft: '15%'
  }
})
