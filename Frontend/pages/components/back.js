import { StyleSheet, Text, TouchableOpacity, Image} from 'react-native';

const Back = ({navigation, onBack}) => {

  // run optional function before navigating back
  const onClickHandler = () => {
      if (onBack) {
        onBack();
      }
      navigation.goBack();
  }

  return <TouchableOpacity onPress={onClickHandler} style={styles.container}>
            <Image source={require('../../../assets/images/left.png')}
            />
            <Text style={styles.text}>  Back</Text>
         </TouchableOpacity>;
}

export default Back;

const styles=StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    marginBottom: 20,
  },

  text: {
    fontSize: 17,
  },
});

