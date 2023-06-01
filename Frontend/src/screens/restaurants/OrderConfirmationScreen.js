
/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import ConfirmModal from '../../components/ConfirmModal'
import { create } from '../../api/OrderEndpoints'
import { Formik } from 'formik'
import * as yup from 'yup'
import InputItem from '../../components/InputItem'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function OrderConfirmationScreen ({ navigation, route }) {
  const [orderToPost, setOrderToPost] = useState(null)
  const { loggedInUser } = useContext(AuthorizationContext)

  const renderProduct = ({ item }) => {
    return (
            <ImageCard
                imageUri={item[0].image ? { uri: process.env.API_BASE_URL + '/' + item[0].image } : defaultProductImage}
                title={item[0].name}
            >
                <TextRegular numberOfLines={2}>{item[0].description}</TextRegular>
                <TextSemiBold textStyle={styles.price}>Quantity: {item[1]}</TextSemiBold>
                <TextSemiBold textStyle={styles.price}>Total cost: {item[1] * item[0].price}€</TextSemiBold>

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

  // Creo un formik con sus variables necesarias:
  const [finalAdressValues, setfinalAdressValues] = useState({ address: loggedInUser.address, postalCode: loggedInUser.postalCode })

  const validationSchema = yup.object().shape({
    address: yup
      .string()
      .max(255, 'Address too long')
      .required('Address is required'),
    postalCode: yup
      .string()
      .max(255, 'Postal code too long')
      .required('Postal code is required')
  })

  const renderHeader = () => {
    return (
      <View style = { styles.confirmateData}>
        <TextSemiBold textStyle ={styles.confirmationText}>Product cost: {route.params.price}</TextSemiBold>
        <TextSemiBold textStyle ={styles.confirmationText}>Shipping costs: {route.params.shippingCosts} </TextSemiBold>
        <TextSemiBold textStyle ={styles.confirmationText}>Total Order Cost: {route.params.price * route.params.shippingCosts} </TextSemiBold>
        <Formik initialValues={finalAdressValues} validationSchema={validationSchema} onSubmit={updateValues}>
        {({ handleSubmit, setFieldValue, values }) => (
           <View style={{ alignItems: 'center' }}>
           <View style={{ width: '80%' }}>
           <InputItem
                name='address'
                label='Address:'
              />
              <InputItem
                name='postalCode'
                label='Postal code:'
              />
            </View>
            <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? GlobalStyles.brandSuccessTap
                      : GlobalStyles.brandSuccess
                  },
                  styles.button
                ]}>
              <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                <MaterialCommunityIcons name='content-save' color={'white'} size={20}/>
                <TextRegular textStyle={styles.text}>
                  Change address and postal code
                </TextRegular>
              </View>
              </Pressable>
            </View>
        )}
        </Formik>
      </View>
    )
  }

  const updateValues = (values) => {
    setfinalAdressValues(values)
    showMessage({
      message: 'The address and the postal code have been changed correctly!',
      type: 'success',
      style: GlobalStyles.brandSuccess,
      titleStyle: GlobalStyles.flashTextStyle
    })
  }

  const postOrder = async (order) => {
    try {
      const orderWithAdress = createOrderWithAdress(order)
      await create(orderWithAdress)
      setOrderToPost(null)
      showMessage({
        message: 'Order succesfully created',
        type: 'success',
        style: GlobalStyles.brandSuccess,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('RestaurantsScreen')
    } catch (error) {
      console.log(error)
      setOrderToPost(null)
      showMessage({
        message: 'Order could not be created',
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('RestaurantsScreen')
    }
  }

  function createOrderWithAdress (order) {
    const productToBeSent = route.params.allProducts.map(x => ({ productId: x[0].id, quantity: x[1] }))
    return {
      address: finalAdressValues.address,
      restaurantId: route.params.restaurantId,
      products: productToBeSent
    }
  }

  return (

        <View style={styles.container}>
            <FlatList
                data={route.params.allProducts}
                renderItem={renderProduct}
                ListEmptyComponent={renderEmptyProductsList}
                ListHeaderComponent={renderHeader}
            />
            <View>
                <Pressable onPress={() => setOrderToPost(true)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed ? GlobalStyles.brandSuccess : GlobalStyles.brandSuccessTap,
                        justifyContent: 'center',
                        alignItems: 'center'
                      },
                      styles.button
                    ]}>
                    <TextRegular style={styles.text}>Confirm Order</TextRegular>
                </Pressable>
                <ConfirmModal
                    isVisible={orderToPost !== null}
                    onClose={() => setOrderToPost(null)}
                    onCancel={() => navigation.navigate('RestaurantsScreen')}
                    onConfirm={() => postOrder(orderToPost)}>
                    <TextRegular>The products of this restaurant will be deleted as well</TextRegular>
                    <TextRegular>If the restaurant has orders, it cannot be deleted.</TextRegular>
                </ConfirmModal>

            </View>
        </View>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  image: {
    height: 100,
    width: 100,
    margin: 10
  },
  description: {
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
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },

  confirmateData: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: GlobalStyles.brandBackground,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold'
  },
  confirmationText: {
    color: 'black',
    textAlign: 'center',
    fontSize: 13
  }
})
