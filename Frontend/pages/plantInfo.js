import {
  Modal,
  Text,
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, formatMatch, scoreColor } from '../src/theme';

const horizontal = Dimensions.get('window').width;
const vertical = Dimensions.get('window').height;

function sunLabel(sunExpo) {
  const s = (sunExpo || '').toLowerCase();
  if (s.includes('shade') && !s.includes('partial')) return { text: 'Shade', emoji: '☁️' };
  if (s.includes('partial')) return { text: 'Partial sun', emoji: '⛅' };
  if (s) return { text: 'Full sun', emoji: '☀️' };
  return { text: 'Sun needs unknown', emoji: '–' };
}

function waterLabel(waterReq) {
  const n = parseInt(waterReq, 10);
  if (!Number.isFinite(n)) return { text: 'Water needs unknown', drops: 0 };
  const drops = Math.min(Math.max(n + 1, 1), 5);
  return { text: `Water level ${n}`, drops };
}

/** Detail modal for a ranked plant; match % comes straight from the API. */
export default function ShowModal({
  prop = {},
  modalVisible,
  close,
  addPlant,
  demoMode = false,
}) {
  const sun = sunLabel(prop.sunExpo);
  const water = waterLabel(prop.waterReq);
  const match = formatMatch(prop.percentMatch);
  const matchColor = scoreColor(prop.percentMatch);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={modalVisible}
      onRequestClose={() => close()}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Pressable style={styles.closeContainer} onPress={() => close()}>
            <Text style={styles.close}>Close</Text>
          </Pressable>

          {prop.image ? (
            <Image
              source={{ uri: prop.image }}
              style={styles.plantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.plantImage, styles.imageFallback]}>
              <Text style={{ color: colors.textMuted }}>No image available</Text>
            </View>
          )}

          {match && (
            <View style={[styles.scoreCard, { borderColor: matchColor }]}>
              <Text style={[styles.scoreValue, { color: matchColor }]}>
                {Math.round(Number(prop.percentMatch))}%
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreTitle}>Preference match</Text>
                <Text style={styles.scoreHint}>
                  Ranked by the Backend scorer from your filters + Earth-Kind
                  rating, not a live popularity metric.
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.plantName}>{prop.name || 'Plant'}</Text>
          <Text style={styles.scientificName}>{prop.scientificName}</Text>

          <View style={styles.attrRow}>
            <View style={styles.attrChip}>
              <Text style={styles.attrChipText}>
                {sun.emoji} {sun.text}
              </Text>
            </View>
            <View style={styles.attrChip}>
              <Text style={styles.attrChipText}>
                {'💧'.repeat(Math.max(water.drops, 1))} {water.text}
              </Text>
            </View>
          </View>

          <View style={styles.middleSection}>
            {!demoMode && typeof addPlant === 'function' ? (
              <TouchableOpacity
                style={styles.buttonOne}
                onPress={() => {
                  addPlant(prop);
                  close();
                }}
              >
                <Text style={styles.buttonOneText}>Add to garden</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.demoNote}>
                <Text style={styles.demoNoteText}>
                  Demo mode: scoring only (sign in to save gardens)
                </Text>
              </View>
            )}
          </View>

          <ScrollView style={{ flex: 1, paddingTop: 4 }}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.body}>
              {prop.description || 'No description provided for this plant.'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeContainer: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  close: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  plantImage: {
    height: Math.min(280, vertical * 0.32),
    marginBottom: 12,
    borderRadius: 12,
    width: '100%',
  },
  imageFallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(28,43,33,0.35)',
  },
  modalView: {
    margin: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    width: Math.min(horizontal * 0.92, 420),
    height: vertical * 0.85,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.bg,
    gap: 12,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    minWidth: 64,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  scoreHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  attrRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  attrChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  attrChipText: {
    color: colors.text,
    fontSize: 13,
  },
  buttonOne: {
    borderRadius: 11,
    flex: 1,
    height: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOneText: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
  },
  demoNote: {
    flex: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: 11,
    padding: 12,
    justifyContent: 'center',
  },
  demoNoteText: {
    color: colors.primaryDark,
    fontSize: 13,
    textAlign: 'center',
  },
  middleSection: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 16,
  },
  plantName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  scientificName: {
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  body: {
    color: colors.text,
    lineHeight: 22,
    fontSize: 15,
  },
});
