import { View, StyleSheet, TouchableOpacity, Text, FlatList,
    SectionList, Image, Modal, SafeAreaView, Dimensions } from 'react-native';
    import React, { useState } from 'react';
    import { CheckBox, Icon } from '@rneui/themed';
    
    const horizontal = Dimensions.get('window').width;
    const vertical = Dimensions.get('window').height;
    
    // static array of filters to display
    const FILTERS = [
      {
        title: 'Type',
        data: ['Vine', 'Annual', 'Perennial', 'Shrub', 'Tropical'],
      },
      {
        title: 'Size',
        data: ['Small', 'Medium', 'Large'],
      },
      {
        title: 'Colors',
        data: ['Orange', 'White', 'Yellow', 'Blue', 'Pink', 'Red'],
      },
      {
        title: 'Blooming Period',
        data: ['Spring', 'Fall', 'Summer', 'Winter'],
      },
      {
        title: 'Sun',
        data: ['Sun', 'Partial Sun', 'Shade'],
      },
      {
        title: 'Has Fruit',
        data: ['True', 'False'],
      },
    ];
    
    const empty = []
    
    for (let i = 0; i < FILTERS.length; i++) {
      const inner = new Array(FILTERS[i].data.length).fill(false)
      empty.push(inner)
    }

    export default function Filter (props) {

      // take in boolean array of filter from input and format it into a filter dictionary
      // that is passed into the api that performs search
      const processFilter = () => {
        const params = ["type", "size", "color", "season", "sun_expo", "fruit"]
        let updatedFilter = {}
        for (let r = 0; r < check.length; r++) {
          for (let c = 0; c < check[r].length; c++) {
            if (check[r][c]) {
              updatedFilter = {
                ...updatedFilter, 
                [params[r]]: FILTERS[r].data[c].toLowerCase()
              }
            }
          }
        }
        return updatedFilter;
      }

      const [modalVisible, setModalVisible] = useState(false);
      const [check, setCheck] = useState(JSON.parse(JSON.stringify(empty)))
    
      // update boolean array of filters
      const toggleCheck = (section, index) => {
        let changed = [...check]
        changed[FILTERS.indexOf(section)][index] = !changed[FILTERS.indexOf(section)][index]
        setCheck(changed)
      }

      // save filter changes and update search filter
      const saveChanges = () => {
        props.onFilterChange(processFilter());
        setModalVisible(false)
      }

      // discard filter changes and reset filter
      const discardChanges = () => {
        setCheck(JSON.parse(JSON.stringify(empty)))
        props.onFilterChange({});
        setModalVisible(false)
      }
    
      return (
        <View style={styles.filterTab}>
          <TouchableOpacity onPress={()=> setModalVisible(true)}>
            <Image source={require('../../assets/images/Funnel.png')}
                style={styles.filter}/>
          </TouchableOpacity>
          <View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.changes}>
              <TouchableOpacity style={styles.save} onPress={() => saveChanges()}>
                <Text style={{marginRight: 4, fontWeight: '700', color: '#2F513C'}}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discard} onPress={() => discardChanges()}>
                <Text style={{fontWeight: '600', color: '#5A6B5E'}}>Discard</Text>
              </TouchableOpacity>
            </View>
            <View>
              <SectionList
                sections={FILTERS}
                keyExtractor={(item, index) => item + index}
                renderItem={({item, index, section}) => (
                  <View style={styles.items}>
                    <CheckBox
                      center={false}
                      title={item}
                      checked={check[FILTERS.indexOf(section)][index]}
                      onPress={() => toggleCheck(section, index)}
                    />
                  </View>
                )}
                renderSectionHeader={({section: {title}}) => (
                  <Text style={styles.header}>{title}</Text>
                )}
              />
            </View>
          </View>
        </View>
        </Modal>
        </View>
        </View>
      )
    }
  
    const styles = StyleSheet.create({
      items: {
        
      },
    
      header: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 4,
        color: '#1C2B21',
      },
    
      centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 22,
      },
    
      modalView: {
        margin: 10,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        width: horizontal,
        height: vertical * 0.9,
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      
      box: {
        height: 200,
        width: 200,
      },
        filterTab: {
        backgroundColor: 'rgba(52, 52, 52, 0.0)',
        height: 40,
        },
    
      filter: {
        alignSelf: 'flex-end',
        margin: 10,
        width: 30,
        height: 30,
      },
    
      changes: {
        flexDirection: 'row', 
        justifyContent: 'flex-end',
      },
    
      check: {
    
      },
      
      save: {
        borderWidth: 1,
        borderColor: '#BED0BC',
        borderRadius: 11,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        backgroundColor: '#BED0BC',
      },
    
      discard: {
        borderWidth: 1,
        borderColor: '#D5DED6',
        borderRadius: 11,
        paddingHorizontal: 14,
        paddingVertical: 8,
      },
    })