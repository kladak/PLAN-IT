import {
  FlatList,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ImageBackground,
  Dimensions,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import ShowModal from './plantInfo';
import Filter from './filter';
import Menu from './components/menu';
import ApiStatusBanner from './components/ApiStatusBanner';
import { searchPlants, ApiError } from '../src/api-calls';
import MyPlantsModal from './myPlantsModal';
import { colors, formatMatch, scoreColor, REGIONS } from '../src/theme';

const horizontal = Dimensions.get('window').width;
const vertical = Dimensions.get('window').height;

function normalizePlant(result, activeFilter) {
  const sunRaw = result['Sun Exposure'];
  let sunExpo = activeFilter.sun_expo || '';
  if (!sunExpo && typeof sunRaw === 'string') {
    sunExpo = sunRaw.split("'").join('').split(',')[0].replace('[', '').trim();
  }

  const percent =
    result['Percent Match'] ?? result.percentMatch ?? result.Score ?? null;

  return {
    description: result.Description || '',
    image: result.Image || null,
    scientificName: result['Scientific Name'] || '',
    name: result.Name || 'Unknown plant',
    id: result.Row,
    percentMatch: percent,
    sunExpo,
    waterReq: result['Water Requirements'],
    type: result.Type || result.type || '',
    score: result.Score,
  };
}

export default function Plants(props) {
  const gardenId = props.route?.params?.gardenId;
  const demoMode = Boolean(props.route?.params?.demo);

  const [modalVisible, setModalVisible] = useState(false);
  const [myPlantsModalVisible, setMyPlantsModalVisible] = useState(false);
  const [modalEntry, setModalEntry] = useState({});
  const [search, setSearch] = useState('');
  const [plants, setPlants] = useState([]);
  const [filter, setFilter] = useState({});
  const [gardenPlants, setGardenPlants] = useState([]);
  const [region, setRegion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [statusKey, setStatusKey] = useState(0);

  const updateFilter = async (newFilter) => {
    setFilter(newFilter);
    updateSearchResults(search, newFilter, region);
  };

  const saveCurrentPlants = (currentPlants) => {
    setGardenPlants(currentPlants);
  };

  const addPlant = (item) => {
    setGardenPlants((old) => [...old, item]);
  };

  const updateSearchResults = useCallback(
    async (query, newFilter, regionId) => {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      try {
        const filterKeys = Object.keys(newFilter || {}).filter(
          (k) => newFilter[k] != null && newFilter[k] !== ''
        );
        const results = await searchPlants({
          ...newFilter,
          query: query || '',
          region: regionId,
          isOnlyText: filterKeys.length === 0,
        });
        const list = Array.isArray(results?.results) ? results.results : [];
        setPlants(list.map((r) => normalizePlant(r, newFilter || {})));
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Something went wrong loading plants.';
        setError(message);
        setPlants([]);
        setStatusKey((k) => k + 1);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial browse so the screen shows ranked results before any filter is applied.
  useEffect(() => {
    updateSearchResults('', {}, region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSearch = async (text) => {
    setSearch(text);
    updateSearchResults(text, filter, region);
  };

  const cycleRegion = () => {
    const next = (region + 1) % REGIONS.length;
    setRegion(next);
    updateSearchResults(search, filter, next);
  };

  const addedPlants = () => {
    setMyPlantsModalVisible(false);
    if (props.navigation?.canGoBack?.()) {
      props.navigation.goBack();
    }
  };

  const renderEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.errorTitle}>Couldn’t load plants</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => updateSearchResults(search, filter, region)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (hasSearched) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptyBody}>
            Try clearing filters, changing the region, or searching by name.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.stateBox}>
        <Text style={styles.emptyTitle}>Find your plants</Text>
        <Text style={styles.emptyBody}>
          Use the search bar or filters to rank plants for your garden.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <ImageBackground
          style={styles.head}
          source={require('../../assets/images/head.png')}
        >
          <Menu navigation={props.navigation} />
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search plants…"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={updateSearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={cycleRegion} style={styles.regionChip}>
            <Text style={styles.regionChipText}>R{region}</Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>

      <ApiStatusBanner refreshKey={statusKey} />

      <View style={styles.toolbar}>
        <View>
          <Text style={styles.toolbarLabel}>
            {demoMode ? 'Demo browse' : 'Plant matches'}
          </Text>
          <Text style={styles.toolbarSub}>{REGIONS[region].label}</Text>
        </View>
        <View style={styles.toolbarRight}>
          {!demoMode && (
            <TouchableOpacity onPress={() => setMyPlantsModalVisible(true)}>
              <Text style={styles.seePlants}>
                My picks ({gardenPlants.length})
              </Text>
            </TouchableOpacity>
          )}
          <Filter onFilterChange={updateFilter} />
        </View>
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Scoring plants…</Text>
        </View>
      )}

      <SafeAreaView style={styles.container}>
        {plants.length > 0 ? (
          <FlatList
            data={plants}
            keyExtractor={(item, index) =>
              String(item.id ?? item.name ?? index)
            }
            style={styles.column}
            contentContainerStyle={styles.listPad}
            numColumns={2}
            renderItem={({ item, index }) => (
              <View style={styles.cardWrap}>
                <TouchableOpacity
                  style={styles.box}
                  onPress={() => {
                    setModalEntry(item);
                    setModalVisible(true);
                  }}
                >
                  {item.image ? (
                    <Image
                      style={styles.plantIcons}
                      source={{ uri: item.image }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.plantIcons, styles.imageFallback]}>
                      <Text style={styles.fallbackText}>No image</Text>
                    </View>
                  )}
                  {formatMatch(item.percentMatch) && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: scoreColor(item.percentMatch) },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {formatMatch(item.percentMatch)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.rankPill}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                </TouchableOpacity>
                <Text numberOfLines={1} style={styles.plantName}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={styles.scientificName}>
                  {item.scientificName}
                </Text>
              </View>
            )}
          />
        ) : (
          renderEmpty()
        )}
      </SafeAreaView>

      <ShowModal
        prop={modalEntry}
        addPlant={demoMode ? undefined : addPlant}
        demoMode={demoMode}
        modalVisible={modalVisible}
        close={() => setModalVisible(false)}
      />
      {!demoMode && (
        <MyPlantsModal
          gardenId={gardenId}
          data={gardenPlants}
          addedPlants={addedPlants}
          navigation={props.navigation}
          saveCurrentPlants={saveCurrentPlants}
          modalVisible={myPlantsModalVisible}
          close={() => setMyPlantsModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  top: {
    paddingTop: 25,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
  },
  head: {
    height: 80,
    width: horizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  searchWrap: {
    flex: 1,
    marginHorizontal: 8,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  regionChip: {
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  regionChipText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  toolbarSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seePlants: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: colors.textMuted,
  },
  container: {
    flex: 1,
  },
  listPad: {
    paddingBottom: 24,
    paddingHorizontal: 4,
  },
  column: {
    flex: 1,
  },
  cardWrap: {
    alignItems: 'center',
    margin: 8,
    width: horizontal * 0.45,
  },
  plantName: {
    fontWeight: '700',
    fontSize: 16,
    maxWidth: 180,
    color: colors.text,
    marginTop: 6,
  },
  scientificName: {
    fontStyle: 'italic',
    fontSize: 13,
    maxWidth: 180,
    color: colors.textMuted,
  },
  plantIcons: {
    alignSelf: 'center',
    width: '100%',
    height: vertical * 0.22,
    borderRadius: 11,
  },
  imageFallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.textMuted,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: horizontal * 0.42,
    height: vertical * 0.22,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  rankPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(28,43,33,0.75)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rankText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  stateBox: {
    margin: 24,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.danger,
    textAlign: 'center',
  },
  errorBody: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
