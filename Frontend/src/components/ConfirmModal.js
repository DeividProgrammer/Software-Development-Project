import React from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import TextSemiBold from './TextSemibold'
import * as GlobalStyles from '../styles/GlobalStyles'
import TextRegular from './TextRegular'

export default function ConfirmModal (props) {
  return (
    <Modal
    presentationStyle='overFullScreen'
    animationType='slide'
    transparent={true}
    visible={props.isVisible}
    onRequestClose={props.onCancel}>
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
      <Pressable
          onPress={props.onClose}
          style={({ pressed }) => [
            {
              backgroundColor: 'white'
            },
            styles.closeButton
          ]}>
          <View style={[{ flex: 1, flexDirection: 'column', justifyContent: 'right' }]}>
            <MaterialCommunityIcons name='close' color={'black'} size={20}/>
          </View>
        </Pressable>
        <TextSemiBold textStyle={{ fontSize: 15 }}>Please confirm your order</TextSemiBold>
        {props.children}
        <Pressable
          onPress={props.onCancel}
          style={({ pressed }) => [
            {
              backgroundColor: pressed
                ? GlobalStyles.brandPrimaryTap
                : GlobalStyles.brandPrimary
            },
            styles.actionButton
          ]}>
          <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='delete' color={'white'} size={20}/>
            <TextRegular textStyle={styles.text}>
              Cancel Order
            </TextRegular>
          </View>
        </Pressable>
        <Pressable
        onPress={props.onConfirm}
        style={({ pressed }) => [
          {
            backgroundColor: pressed
              ? GlobalStyles.brandBlueTap
              : GlobalStyles.brandBlue
          },
          styles.actionButton
        ]}>
      <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
        <MaterialCommunityIcons name='hand-okay' color={'white'} size={20}/>
        <TextRegular textStyle={styles.text}>
          Confirm order
        </TextRegular>
      </View>
    </Pressable>
      </View>
    </View>
  </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.75,
    shadowRadius: 4,
    elevation: 5,
    width: '90%'
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
  text: {
    fontSize: 16,
    color: 'white',
    alignSelf: 'center',
    marginLeft: 5
  },
  closeButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '3%'
  }
})