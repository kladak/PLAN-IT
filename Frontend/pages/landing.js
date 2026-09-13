import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import Title from './components/title';
import ApiStatusBanner from './components/ApiStatusBanner';
import { colors } from '../src/theme';

/** First screen — professional entry + demo path for portfolio reviewers. */
export default function Landing({ navigation }) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <ImageBackground
        style={[styles.backgroundImage, { width, minHeight: height }]}
        source={require('../../assets/images/plantbackground.png')}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Title />
          <Text style={styles.tagline}>
            Rank Texas A&M Earth-Kind plants for your garden conditions.
          </Text>
          <Text style={styles.action}>Let's build your garden</Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryBtnText}>Sign in</Text>
            <Image
              source={require('../../assets/images/next.png')}
              style={styles.startImage}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() =>
              navigation.navigate('Plants', { demo: true, gardenId: null })
            }
          >
            <Text style={styles.secondaryBtnText}>
              Browse plant matches (no account)
            </Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Demo browse talks to the local Flask API — start Backend on port
            5001 first.
          </Text>
        </View>
      </ImageBackground>
      <View style={styles.statusDock}>
        <ApiStatusBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backgroundImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 12,
  },
  tagline: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.text,
    opacity: 0.9,
  },
  action: {
    marginTop: 28,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  primaryBtn: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 280,
    height: 48,
    paddingHorizontal: 16,
    marginTop: 28,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryBtn: {
    width: '100%',
    maxWidth: 280,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  startImage: {
    width: 22,
    height: 22,
  },
  hint: {
    marginTop: 18,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.textMuted,
    maxWidth: 320,
  },
  statusDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
