import { Text, TextInput, StyleSheet, Image, SafeAreaView, View, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import Title from '../components/title';
import { useEffect, useState } from 'react';

import { authEventListener, login } from '../../src/authentication.js'

export default function Login ({navigation}) { 

  // set an event listener to log the user in and to make them not log in again if they're
  // already logged in
  useEffect(() => {
    const listener = authEventListener(() => navigation.navigate("Dashboard"))
    return listener;
  }, []);

  // state to keep track of email and password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
        <Image 
          style={styles.image}
          source={require('../../../assets/images/logo.png')}
        />
        <Title/>
        <TextInput
          autoFocus={true}
          autoCorrect={false}
          autoCapitalize='none'
          onChange={(event) => setEmail(event.nativeEvent.text)}
          style={styles.input}
          backgroundColor="#BED0BC"
          placeholder="Email"
          placeholderTextColor="#000"
        />
        <TextInput
          autoCorrect={false}
          autoCapitalize='none'
          onChange={(event) => {
            setPassword(event.nativeEvent.text)
          }}
          secureTextEntry={true}
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000"
        />
        <TouchableOpacity onPress={() => login(email, password, () => navigation.navigate("Dashboard"))}>
          <Text style={styles.button}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={{marginTop: 20}}>New? Register</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Plants', { demo: true, gardenId: null })}
        >
          <Text style={{marginTop: 16, color: '#3E6B4F', fontWeight: '600'}}>
            Or browse plant matches without signing in
          </Text>
        </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  
  input: {
    width: 247,
    borderWidth: 1,
    height: 41,
    marginVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    
  },
  image: {
    margin: 10,
  },

  button: {
    width: '80%',
    marginTop: 10
  }
})